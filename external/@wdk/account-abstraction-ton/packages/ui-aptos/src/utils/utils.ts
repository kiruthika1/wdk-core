import {type AptosClient, type MaybeHexString, BCS, HexString, ApiError} from 'aptos';

const ZERO_ADDRESS_HEX = fullAddress('0x0').toString();

// https://github.com/LayerZero-Labs/monorepo/blob/main/packages/layerzero-v1/aptos/sdk/src/modules/uln/uln_config.ts#L200
export async function getUlnFee(
  client: AptosClient,
  accounts: Accounts,
  uaAddress: MaybeHexString,
  dstEid: BCS.Uint16,
  payloadSize: number,
  query?: Query,
) {
  const [appConfig, treasuryConfigResource] = await Promise.all([
    getAppConfig(client, accounts, uaAddress, dstEid, query),
    getMsgLibGlobalStore(client, accounts, query),
  ]);

  const [oracleFee, relayerFee] = await Promise.all([
    getUlnSignerFee(client, accounts, appConfig.oracle, dstEid, query),
    getUlnSignerFee(client, accounts, appConfig.relayer, dstEid, query),
  ]);

  console.log(`treasuryConfigResource`, treasuryConfigResource.data);
  const {treasury_fee_bps: treasuryFeeBps} = treasuryConfigResource.data as {
    treasury_fee_bps: string;
  };

  // lz fee
  let totalFee = relayerFee.base_fee + relayerFee.fee_per_byte * BigInt(payloadSize);
  totalFee += oracleFee.base_fee + oracleFee.fee_per_byte * BigInt(payloadSize);
  totalFee += (BigInt(treasuryFeeBps) * totalFee) / BigInt(10000);

  return totalFee;
}

export async function getMsgLibGlobalStore(client: AptosClient, accounts: Accounts, query?: Query) {
  return client.getAccountResource(
    accounts.layerzero.address,
    `${accounts.layerzero.address}::msglib_v1_0::GlobalStore`,
    query,
  );
}

export async function getAppConfig(
  client: AptosClient,
  accounts: Accounts,
  uaAddress: MaybeHexString,
  dstEid: BCS.Uint16,
  query?: Query,
): Promise<UlnConfigType> {
  const defaultConfigPromise = getDefaultAppConfig(client, accounts, dstEid, query);

  let appConfig: UlnConfigType | undefined = undefined;
  try {
    const module = `${accounts.layerzero.address}::uln_config`;

    const resource = await client.getAccountResource(
      accounts.layerzero.address,
      `${module}::UaUlnConfig`,
      query,
    );
    const {config} = resource.data as {config: {handle: string}};

    appConfig = await client.getTableItem(
      config.handle,
      {
        key_type: `${module}::UaConfigKey`,
        value_type: `${module}::UlnConfig`,
        key: {
          ua_address: HexString.ensure(uaAddress).toString(),
          chain_id: dstEid.toString(),
        },
      },
      query,
    );

    console.log(`Config: `, appConfig);
  } catch (e) {
    if (!isErrorOfApiError(e, 404)) {
      throw e;
    }
  }

  const defaultConfig = await defaultConfigPromise;
  console.log('defaultConfig', defaultConfig);
  const mergedConfig = appConfig ? mergeConfig(appConfig, defaultConfig) : defaultConfig;
  //address type in move are reutrned as short string
  mergedConfig.oracle = fullAddress(mergedConfig.oracle).toString();
  mergedConfig.relayer = fullAddress(mergedConfig.relayer).toString();
  mergedConfig.inbound_confirmations = BigInt(mergedConfig.inbound_confirmations);
  mergedConfig.outbound_confirmations = BigInt(mergedConfig.outbound_confirmations);
  return mergedConfig;
}

export async function getUlnSignerFee(
  client: AptosClient,
  accounts: Accounts,
  address: MaybeHexString,
  dstEid: BCS.Uint16,
  query?: Query,
) {
  try {
    const module = `${accounts.layerzero.address}::uln_signer`;
    const resource = await client.getAccountResource(address, `${module}::Config`, query);
    const {fees} = resource.data as {fees: {handle: string}};
    const response = await client.getTableItem(
      fees.handle,
      {
        key_type: `u64`,
        value_type: `${module}::Fee`,
        key: dstEid.toString(),
      },
      query,
    );
    return {
      base_fee: BigInt(response.base_fee),
      fee_per_byte: BigInt(response.fee_per_byte),
    };
  } catch (e) {
    if (isErrorOfApiError(e, 404)) {
      return {
        base_fee: BigInt(0),
        fee_per_byte: BigInt(0),
      };
    }
    throw e;
  }
}

export async function getExecutorFee(
  client: AptosClient,
  accounts: Accounts,
  uaAddress: MaybeHexString,
  dstEid: BCS.Uint16,
  adapterParams: BCS.Bytes,
  query?: Query,
) {
  const [executor] = accounts.executor
    ? [accounts.executor.address, accounts.executor.version]
    : await getExecutor(client, accounts, uaAddress, dstEid, query);

  const fee = await getFee(executor, dstEid, query);
  const [, uaGas, airdropAmount] = decodeAdapterParams(adapterParams);
  return ((uaGas * fee.gasPrice + airdropAmount) * fee.priceRatio) / 10000000000n;

  async function getFee(
    executor: MaybeHexString,
    eid: BCS.Uint16,
    query?: Query,
  ): Promise<ExecutorFee> {
    try {
      const module = `${accounts.layerzero.address}::executor_v1`;
      const resource = await client.getAccountResource(
        executor,
        `${module}::ExecutorConfig`,
        query,
      );
      const {fee} = resource.data as {fee: {handle: string}};
      const response = await client.getTableItem(
        fee.handle,
        {
          key_type: 'u64',
          value_type: `${module}::Fee`,
          key: eid.toString(),
        },
        query,
      );
      return {
        airdropAmtCap: BigInt(response.airdrop_amt_cap),
        priceRatio: BigInt(response.price_ratio),
        gasPrice: BigInt(response.gas_price),
      };
    } catch (e) {
      if (isErrorOfApiError(e, 404)) {
        return {
          airdropAmtCap: 0n,
          priceRatio: 0n,
          gasPrice: 0n,
        };
      }
      throw e;
    }
  }
}

export async function getExecutor(
  client: AptosClient,
  accounts: Accounts,
  uaAddress: MaybeHexString,
  dstEid: BCS.Uint16,
  query?: Query,
): Promise<[string, BCS.Uint64]> {
  const configuredPromise = getConfiguredExecutor(client, accounts, uaAddress, dstEid, query);
  const defaultPromise = getDefaultExecutor(client, accounts, dstEid);
  try {
    return await configuredPromise;
  } catch (e) {
    if (isErrorOfApiError(e, 404)) {
      return await defaultPromise;
    }
    throw e;
  }
}
export async function getMinDstGas(
  client: AptosClient,
  accounts: Accounts,
  uaAddress: MaybeHexString,
  dstEid: BCS.Uint16,
  packetType: BCS.Uint64,
): Promise<BCS.Uint64> {
  const module = `${accounts.layerzero.address}::lzapp`;
  const resource = await client.getAccountResource(uaAddress, `${module}::Config`);
  const {min_dst_gas_lookup} = resource.data as {min_dst_gas_lookup: {handle: string}};

  try {
    const response = await client.getTableItem(min_dst_gas_lookup.handle, {
      key_type: `${module}::Path`,
      value_type: 'u64',
      key: {
        chain_id: dstEid.toString(),
        packet_type: packetType.toString(),
      },
    });
    return BigInt(response);
  } catch (e) {
    if (isErrorOfApiError(e, 404)) {
      return BigInt(0);
    }
    throw e;
  }
}

export async function getConfiguredExecutor(
  client: AptosClient,
  accounts: Accounts,
  uaAddress: MaybeHexString,
  dstEid: BCS.Uint16,
  query?: Query,
): Promise<[string, BCS.Uint64]> {
  const module = `${accounts.layerzero.address}::executor_config`;
  const resource = await client.getAccountResource(uaAddress, `${module}::ConfigStore`, query);
  const {config} = resource.data as {config: {handle: string}};
  const response = await client.getTableItem(
    config.handle,
    {
      key_type: 'u64',
      value_type: `${module}::Config`,
      key: dstEid.toString(),
    },
    query,
  );
  return [response.executor, response.version];
}

export async function getDefaultExecutor(
  client: AptosClient,
  accounts: Accounts,
  dstEid: BCS.Uint16,
): Promise<[string, BCS.Uint64]> {
  const module = `${accounts.layerzero.address}::executor_config`;
  const resource = await client.getAccountResource(
    accounts.layerzero.address,
    `${module}::ConfigStore`,
  );

  const {config} = resource.data as {config: {handle: string}};
  try {
    const response = await client.getTableItem(config.handle, {
      key_type: 'u64',
      value_type: `${module}::Config`,
      key: dstEid.toString(),
    });
    console.log('default executor', response);
    return [response.executor, response.version];
  } catch (e) {
    if (isErrorOfApiError(e, 404)) {
      return ['', BigInt(0)];
    }
    throw e;
  }
}

// txType 1
// bytes  [2       8       ]
// fields [txType  extraGas]
// txType 2
// bytes  [2       8         8           unfixed       ]
// fields [txType  extraGas  airdropAmt  airdropAddress]
export function decodeAdapterParams(
  adapterParams: BCS.Bytes,
): [type: BCS.Uint16, uaGas: BCS.Uint64, airdropAmount: BCS.Uint64, airdropAddress: string] {
  const type = adapterParams[0] * 256 + adapterParams[1];
  if (type === 1) {
    // default
    if (adapterParams.length !== 10) throw new Error('invalid adapter params');

    const uaGas = adapterParams.slice(2, 10);
    return [type, convertBytesToUint64(uaGas), 0n, ''];
  } else if (type === 2) {
    // airdrop
    if (adapterParams.length <= 18) throw new Error('invalid adapter params');

    const uaGas = adapterParams.slice(2, 10);
    const airdropAmount = adapterParams.slice(10, 18);
    const airdropAddressBytes = adapterParams.slice(18);
    return [
      type,
      convertBytesToUint64(uaGas),
      convertBytesToUint64(airdropAmount),
      HexString.fromUint8Array(airdropAddressBytes).toString(),
    ];
  } else {
    throw new Error('invalid adapter params');
  }
}

export function buildAirdropAdapterParams(
  uaGas: BCS.Uint64 | BCS.Uint32,
  airdropAmount: BCS.Uint64 | BCS.Uint32,
  airdropAddress: string,
): BCS.Bytes {
  if (airdropAmount === 0n) {
    return buildDefaultAdapterParams(uaGas);
  }
  const params = [0, 2]
    .concat(Array.from(convertUint64ToBytes(uaGas)))
    .concat(Array.from(convertUint64ToBytes(airdropAmount)))
    .concat(Array.from(HexString.ensure(airdropAddress).toUint8Array()));

  return Buffer.from(params);
}

export function buildDefaultAdapterParams(uaGas: BCS.Uint64 | BCS.Uint32): BCS.Bytes {
  const params = [0, 1].concat(Array.from(convertUint64ToBytes(uaGas)));
  return Uint8Array.from(Buffer.from(params));
}

export function convertUint64ToBytes(number: BCS.Uint64 | BCS.Uint32): BCS.Bytes {
  return BCS.bcsSerializeUint64(number).reverse(); //big endian
}

export function convertBytesToUint64(bytes: BCS.Bytes): BCS.Uint64 {
  if (bytes.length !== 8) {
    throw new Error('Buffer must be exactly 8 bytes long.');
  }

  let uint64BigInt = 0n;
  for (let i = 0; i < 8; i++) {
    uint64BigInt = (uint64BigInt << 8n) | BigInt(bytes[i]);
  }

  return uint64BigInt;
}

export function isErrorOfApiError(e: any, status: number): boolean {
  if (e instanceof ApiError) {
    return e.status === status;
  } /** else if (e instanceof Types.ApiError) {
          return e.status === status
      } */ else if (e instanceof Error && e.constructor.name.match(/ApiError[0-9]*/)) {
    if (Object.prototype.hasOwnProperty.call(e, 'vmErrorCode')) {
      const err = e as ApiError;
      return err.status === status;
    } else if (Object.prototype.hasOwnProperty.call(e, 'request')) {
      // const err = e as Types.ApiError
      const err = e as ApiError;
      return err.status === status;
    }
  } else if (e instanceof Error) {
    if (Object.prototype.hasOwnProperty.call(e, 'status')) {
      return (e as any).status === status;
    }
  }
  return false;
}

export type Accounts = {
  layerzero_apps: {
    address: MaybeHexString;
  };
  layerzero: {
    address: MaybeHexString;
  };
  executor?: {
    address: MaybeHexString;
    version: bigint;
  };
};

export async function getMessageFee(
  client: AptosClient,
  accounts: Accounts,
  uaAddress: MaybeHexString,
  dstEid: BCS.Uint16,
  adapterParams: BCS.Bytes,
  payloadSize: number,
  query?: Query,
): Promise<BCS.Uint64> {
  const [ulnFee, executorFee] = await Promise.all([
    getUlnFee(client, accounts, uaAddress, dstEid, payloadSize, query),
    getExecutorFee(client, accounts, uaAddress, dstEid, adapterParams, query),
  ]);

  const totalFee = BigInt(ulnFee) + BigInt(executorFee);
  return totalFee;
}

export async function getDefaultAppConfig(
  client: AptosClient,
  accounts: Accounts,
  remoteEid: BCS.Uint16,
  query?: Query,
): Promise<UlnConfigType> {
  if (accounts.layerzero === undefined) {
    throw new Error('sdk accounts layerzero is undefined when invoke getDefaultAppConfig');
  }
  const module = `${accounts.layerzero.address}::uln_config`;
  const resource = await client.getAccountResource(
    accounts.layerzero.address,
    `${module}::DefaultUlnConfig`,
    query,
  );
  const {config} = resource.data as {config: {handle: string}};
  try {
    return await client.getTableItem(
      config.handle,
      {
        key_type: 'u64',
        value_type: `${module}::UlnConfig`,
        key: remoteEid.toString(),
      },
      query,
    );
  } catch (e) {
    if (isErrorOfApiError(e, 404)) {
      return {
        inbound_confirmations: BigInt(0),
        oracle: '',
        outbound_confirmations: BigInt(0),
        relayer: '',
      };
    }
    throw e;
  }
}

export interface UlnConfigType {
  inbound_confirmations: BCS.Uint64 | BCS.Uint32;
  oracle: MaybeHexString;
  outbound_confirmations: BCS.Uint64 | BCS.Uint32;
  relayer: MaybeHexString;
}

export function fullAddress(address: string | HexString): HexString {
  const rawValue = HexString.ensure(address).noPrefix();
  return HexString.ensure(
    Buffer.concat([Buffer.alloc(64 - rawValue.length, '0'), Buffer.from(rawValue)]).toString(),
  );
}

function isSameAddress(a: string | HexString, b: string | HexString): boolean {
  return fullAddress(a).toString() === fullAddress(b).toString();
}

function isZeroAddress(a: string | HexString): boolean {
  return isSameAddress(a, ZERO_ADDRESS_HEX);
}

function mergeConfig(config: UlnConfigType, defaultConfig: UlnConfigType): UlnConfigType {
  const mergedConfig = {...defaultConfig};
  if (!isZeroAddress(config.oracle)) {
    mergedConfig.oracle = config.oracle;
  }
  if (!isZeroAddress(config.relayer)) {
    mergedConfig.relayer = config.relayer;
  }
  if (config.inbound_confirmations > 0) {
    mergedConfig.inbound_confirmations = config.inbound_confirmations;
  }
  if (config.outbound_confirmations > 0) {
    mergedConfig.outbound_confirmations = config.outbound_confirmations;
  }

  return mergedConfig;
}

export interface ExecutorFee {
  airdropAmtCap: BCS.Uint64;
  priceRatio: BCS.Uint64;
  gasPrice: BCS.Uint64;
}

export interface Query {
  ledgerVersion?: bigint | number;
}
