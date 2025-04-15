import {hexlify} from '@ethersproject/bytes';
import {OftPDADeriver, OftProgram, OftTools, SendHelper} from '@layerzerolabs/lz-solana-sdk-v2';
import {
  type GetMessageFeeInput,
  type GetOutputInput,
  type BridgeOutput,
  type GetDurationInput,
  type GetLimitInput,
  type GetExtraGasInput,
  type GetAllowanceInput,
  type GetOptionsInput,
  type BridgeOptions,
  type GetUnclaimedInput,
  type IsRegisteredInput,
  type TransferInput,
  type ClaimInput,
  type RegisterInput,
  type ApproveInput,
  type BridgeOption,
  validateInput,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import {
  type Currency,
  type FeeQuote,
  CurrencyAmount,
  type Transaction,
  type ChainKey,
  isToken,
  assert,
  isSolanaChainKey,
  MaxUint256,
  MessageFee,
  castCurrencyAmountUnsafe,
  AdapterParams,
  hasAddress,
} from '@wdk-account-abstraction-ton/ui-core';
import {addressToBytes32} from '@wdk-account-abstraction-ton/ui-evm';
import {
  type SolanaSigner,
  createTransaction,
  getSimulationComputeUnits,
} from '@wdk-account-abstraction-ton/ui-solana';
import {getAssociatedTokenAddress, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import type {AccountMeta} from '@solana/web3.js';
import {
  type AddressLookupTableAccount,
  type Commitment,
  ComputeBudgetProgram,
  type Connection,
  type GetAccountInfoConfig,
  type MessageV0,
  PublicKey,
  type TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import moize from 'moize';

import type {OftBridgeApi, OftBridgeConfig, OftBridgeFee} from '../types';
import {createOptions} from '../utils';

export class OftBridgeV3__solana implements OftBridgeApi<SolanaSigner> {
  protected sendHelper = new SendHelper();
  protected derivers: Record<ChainKey, OftPDADeriver> = {};
  protected logger: typeof console | undefined = undefined;

  constructor(
    protected readonly connection: Connection,
    public readonly config: OftBridgeConfig,
    {
      cacheTime = 0,
      verbose = false,
    }: {
      verbose?: boolean;
      // in ms
      cacheTime?: number;
    } = {},
  ) {
    this.validateConfig(config);

    if (verbose) {
      this.logger = console;
    }

    if (cacheTime > 0) {
      const options = {
        isDeepEqual: true,
        isPromise: true,
        maxSize: 1_000,
        maxAge: cacheTime,
      };

      this.quoteOft = moize(this.quoteOft.bind(this), options);
      this.getMessageFee = moize(this.getMessageFee.bind(this), options);
      this.getPeerInfo = moize(this.getPeerInfo.bind(this), options);
      this.getQuoteAccounts = moize(this.getQuoteAccounts.bind(this), options);
      this.getSendAccounts = moize(this.getSendAccounts.bind(this), options);
    }
  }

  protected getConnection(chainKey: ChainKey) {
    // todo: support multiple connections if OFT deployed on multiple solana networks
    return this.connection;
  }

  protected getTokenProgramId(chainKey: ChainKey) {
    return TOKEN_PROGRAM_ID;
  }

  protected getOftProgramId(chainKey: ChainKey) {
    const deployment = this.getDeployment(chainKey);
    assert(deployment.oft?.programId, 'programId is required');
    return new PublicKey(deployment.oft.programId);
  }

  protected getDeriver(chainKey: ChainKey) {
    if (!this.derivers[chainKey]) {
      const oftProgramId = this.getOftProgramId(chainKey);
      const deriver = new OftPDADeriver(oftProgramId);
      this.derivers[chainKey] = deriver;
    }
    return this.derivers[chainKey];
  }

  protected getOftInstance(chainKey: ChainKey): PublicKey {
    const deriver = this.getDeriver(chainKey);
    const deployment = this.getDeployment(chainKey);
    assert(hasAddress(deployment.token), 'Token address is required');
    const tokenMint = new PublicKey(deployment.token.address);
    const tokenEscrow = deployment.tokenEscrow
      ? new PublicKey(deployment.tokenEscrow.address)
      : undefined;
    return deriver.oftConfig(tokenEscrow ?? tokenMint)[0];
  }

  protected validateConfig(config: OftBridgeConfig) {
    // todo: validate that solana has programId
    assert(config.version === 3, 'OftBridgeConfig version 3 is required');
  }

  supportsClaim(token: Currency): boolean {
    return this.supportsRegister(token);
  }

  supportsRegister(token: Currency): boolean {
    const {chainKey} = token;
    if (!isSolanaChainKey(chainKey)) return false;
    return Boolean(this.tryGetDeployment(token.chainKey)?.token.equals(token));
  }

  supportsTransfer(srcToken: Currency, dstToken: Currency): boolean {
    return Boolean(
      isSolanaChainKey(srcToken.chainKey) &&
        this.tryGetDeployment(srcToken.chainKey)?.token.equals(srcToken) &&
        this.tryGetDeployment(dstToken.chainKey)?.token.equals(dstToken),
    );
  }

  protected async getQuoteAccounts(
    srcChainKey: ChainKey,
    srcAddress: string,
    dstEid: number,
  ): Promise<AccountMeta[]> {
    const connection = this.getConnection(srcChainKey);
    const oftInstance = this.getOftInstance(srcChainKey);
    const peer = this.getPeer(srcChainKey, dstEid);
    const payer = new PublicKey(srcAddress);
    const peerInfo = await this.getPeerInfo(connection, peer);
    const remainingAccounts = await this.sendHelper.getQuoteAccounts(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection as any,
      payer,
      oftInstance,
      dstEid,
      hexlify(peerInfo.address),
    );
    return remainingAccounts;
  }

  protected async getSendAccounts(
    srcChainKey: ChainKey,
    srcAddress: string,
    dstEid: number,
  ): Promise<AccountMeta[]> {
    const connection = this.getConnection(srcChainKey);
    const payer = new PublicKey(srcAddress);
    const oftInstance = this.getOftInstance(srcChainKey);
    const peer = this.getPeer(srcChainKey, dstEid);
    const peerInfo = await this.getPeerInfo(connection, peer);
    const remainingAccounts = await this.sendHelper.getSendAccounts(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection as any,
      payer,
      oftInstance,
      dstEid,
      hexlify(peerInfo.address),
    );
    return remainingAccounts;
  }

  async getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote> {
    this.logger?.log('getMessageFee', input);
    if (!input.srcAddress) throw new Error('srcAddress is required');
    if (!isToken(input.srcToken)) throw new Error('srcToken is required');
    if (!input.srcAmount) throw new Error('srcAmount is required');
    if (!input.dstAmountMin) throw new Error('dstAmountMin is required');
    if (!input.dstAddress) throw new Error('dstAddress is required');
    const srcChainKey = input.srcToken.chainKey;
    const dstChainKey = input.dstToken.chainKey;
    const deployment = this.getDeployment(srcChainKey);
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const payer = new PublicKey(input.srcAddress);
    const tokenMint = new PublicKey(input.srcToken.address);
    const amountLd = input.srcAmount.toBigInt();
    const minAmountLd = castCurrencyAmountUnsafe(input.dstAmountMin, input.srcToken).toBigInt();
    const to = addressToBytes32(input.dstAddress);
    const tokenEscrow = deployment.tokenEscrow
      ? new PublicKey(deployment.tokenEscrow.address)
      : undefined;
    const composeMsg = undefined;
    const {adapterParams} = input;
    const payInLzToken = false;
    const peer = this.getPeer(srcChainKey, dstEid);
    const connection = this.getConnection(srcChainKey);
    const tokenProgramId = this.getTokenProgramId(srcChainKey);
    const oftProgramId = this.getOftProgramId(srcChainKey);

    // don't waterfall
    const [options, peerInfo, remainingAccounts] = await Promise.all([
      this.createOptions({adapterParams, dstChainKey}),
      this.getPeerInfo(connection, peer),
      this.getQuoteAccounts(srcChainKey, input.srcAddress, dstEid),
    ]);

    const quote = await OftTools.quoteWithUln(
      // Getting error saying that Connection isn't assignable to Connection from the same package
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection as any,
      payer,
      tokenMint,
      dstEid,
      amountLd,
      minAmountLd,
      options.toBytes(),
      Array.from(to),
      payInLzToken,
      tokenEscrow,
      composeMsg,
      peerInfo.address,
      remainingAccounts,
      tokenProgramId,
      oftProgramId,
    );

    return MessageFee.from(srcChainKey, {nativeFee: quote.nativeFee, zroFee: quote.lzTokenFee});
  }

  public async createOptions({
    adapterParams,
    dstChainKey,
  }: {
    adapterParams: AdapterParams;
    dstChainKey: ChainKey;
  }) {
    return createOptions({adapterParams, dstChainKey}, this.config);
  }

  async getOutput(input: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    assert(input.srcAddress, 'srcAddress is required');
    assert(input.dstAddress, 'dstAddress is required');
    assert(input.srcAmount, 'srcAmount is required');
    assert(input.dstAmountMin, 'dstAmountMin is required');
    assert(input.adapterParams, 'adapterParams is required');

    const srcToken = input.srcAmount.token;
    const dstToken = input.dstToken;
    const quote = await this.quoteOft({
      srcAddress: input.srcAddress,
      dstAddress: input.dstAddress,
      srcAmount: input.srcAmount,
      dstAmountMin: input.dstAmountMin,
      adapterParams: input.adapterParams,
    });

    const dstAmount = castCurrencyAmountUnsafe(quote.oftReceipt.amountReceivedLd, dstToken);
    const bridgeFeeBigInt = quote.oftFeeDetails.reduce(
      (acc, value) => acc + value.feeAmountLd.toBigInt(),
      0n,
    );
    const bridgeFee = CurrencyAmount.fromBigInt(srcToken, bridgeFeeBigInt);

    return {
      dstAmount,
      fee: {
        bridgeFee,
      },
    };
  }

  getDuration(input: GetDurationInput): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async getLimit(input: GetLimitInput): Promise<CurrencyAmount<Currency>> {
    assert(input.srcAddress, 'srcAddress is required');
    assert(input.dstAddress, 'dstAddress is required');
    assert(input.srcAmount, 'srcAmount is required');
    assert(input.dstAmountMin, 'dstAmountMin is required');
    assert(input.adapterParams, 'adapterParams is required');
    const quote = await this.quoteOft({
      srcAddress: input.srcAddress,
      dstAddress: input.dstAddress,
      srcAmount: input.srcAmount,
      dstAmountMin: input.dstAmountMin,
      adapterParams: input.adapterParams,
    });

    return quote.oftLimits.maxAmountLd;
  }

  protected async quoteOft(input: {
    srcAddress: string;
    dstAddress: string;
    srcAmount: CurrencyAmount<Currency>;
    dstAmountMin: CurrencyAmount<Currency>;
    adapterParams: AdapterParams;
  }) {
    this.logger?.log('quoteOft', input);
    const srcToken = input.srcAmount.token;
    const dstToken = input.dstAmountMin.token;
    const srcChainKey = srcToken.chainKey;
    const dstChainKey = dstToken.chainKey;
    const srcAddress = input.srcAddress;
    const dstAddress = input.dstAddress;
    const deployment = this.getDeployment(srcChainKey);
    assert(isToken(deployment.token), 'Token address is required');
    const payer = new PublicKey(srcAddress);
    const tokenMint = new PublicKey(deployment.token.address);
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const amountLd = input.srcAmount.toBigInt();
    const minAmountLd = BigInt(0);
    const to = addressToBytes32(dstAddress);
    const tokenEscrow = deployment.tokenEscrow
      ? new PublicKey(deployment.tokenEscrow.address)
      : undefined;
    const connection = this.getConnection(srcChainKey);

    const adapterParams = AdapterParams.forV1(0);
    const options = await this.createOptions({adapterParams, dstChainKey});
    const payInLzToken = false;
    const composeMsg = undefined;
    const tokenProgramId = this.getTokenProgramId(srcChainKey);
    const oftProgramId = this.getOftProgramId(srcChainKey);
    const {oftLimits, oftReceipt, oftFeeDetails} = await OftTools.quoteOft(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection as any,
      payer,
      tokenMint,
      dstEid,
      amountLd,
      minAmountLd,
      options.toBytes(),
      Array.from(to),
      payInLzToken,
      tokenEscrow,
      composeMsg,
      tokenProgramId,
      oftProgramId,
    );
    const ld = (amount: string) => CurrencyAmount.fromBigInt(srcToken, BigInt(amount));

    return {
      oftLimits: {
        minAmountLd: ld(oftLimits.minAmountLd.toString()),
        maxAmountLd: ld(oftLimits.maxAmountLd.toString()),
      },
      oftReceipt: {
        amountReceivedLd: ld(oftReceipt.amountReceivedLd.toString()),
        amountSentLd: ld(oftReceipt.amountSentLd.toString()),
      },
      oftFeeDetails: oftFeeDetails.map((value) => ({
        description: value.description,
        feeAmountLd: ld(value.feeAmountLd.toString()),
      })),
    };
  }

  async getExtraGas(input: GetExtraGasInput): Promise<number> {
    // gas is set by enforced options
    return 0;
  }
  async getAllowance({token}: GetAllowanceInput): Promise<CurrencyAmount<Currency>> {
    // solana doesn't need approve
    return CurrencyAmount.fromRawAmount(token, MaxUint256);
  }
  async getOptions(input: GetOptionsInput): Promise<BridgeOptions> {
    const taxiOption: BridgeOption = {
      mode: 'taxi',
    };
    return {options: [taxiOption]};
  }

  async getUnclaimed({token}: GetUnclaimedInput): Promise<CurrencyAmount<Currency>> {
    return CurrencyAmount.fromRawAmount(token, 0);
  }
  async isRegistered(input: IsRegisteredInput): Promise<boolean> {
    // todo: check if need to verify rent
    return true;
  }
  async transfer(input: TransferInput): Promise<Transaction<SolanaSigner>> {
    validateInput(input);
    const payer = new PublicKey(input.srcAddress);
    const {srcChainKey} = input;
    const connection = this.getConnection(srcChainKey);

    const transactionInstruction = await this.getTransactionInstruction(input);
    const computeUnitsLimit = await this.getComputeUnitsLimit(
      connection,
      transactionInstruction,
      input,
    );
    const computeUnitsBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnitsLimit,
    });

    const versionedTransaction = await buildVersionedTransaction(connection, payer, [
      computeUnitsBudgetInstruction,
      transactionInstruction,
    ]);

    return createTransaction(versionedTransaction, {connection});
  }
  claim(input: ClaimInput): Promise<Transaction<SolanaSigner>> {
    throw new Error('Method not implemented.');
  }
  register(register: RegisterInput): Promise<Transaction<SolanaSigner>> {
    throw new Error('Method not implemented.');
  }
  approve(input: ApproveInput): Promise<Transaction<SolanaSigner>> {
    throw new Error('Method not implemented.');
  }

  protected async getTransactionInstruction(
    input: Required<TransferInput>,
  ): Promise<TransactionInstruction> {
    const deployment = this.getDeployment(input.srcChainKey);
    assert(isToken(deployment.token), 'Token address is required');
    const payer = new PublicKey(input.srcAddress);
    const tokenMint = new PublicKey(deployment.token.address);
    const tokenSource = await getAssociatedTokenAddress(tokenMint, payer);
    const srcChainKey = input.srcToken.chainKey;
    const dstChainKey = input.dstToken.chainKey;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);
    const amountLd = input.srcAmount.toBigInt();
    const minAmountLd = castCurrencyAmountUnsafe(input.dstAmountMin, input.srcToken).toBigInt();
    const to = addressToBytes32(input.dstAddress);
    const nativeFee = input.fee.nativeFee.toBigInt();
    const lzTokenFee = input.fee.zroFee.toBigInt();
    const tokenEscrow = deployment.tokenEscrow
      ? new PublicKey(deployment.tokenEscrow.address)
      : undefined;
    const composeMsg = undefined;
    const {adapterParams} = input;
    const options = await this.createOptions({adapterParams, dstChainKey});

    const connection = this.getConnection(srcChainKey);
    const peer = this.getPeer(srcChainKey, dstEid);
    const peerInfo = await this.getPeerInfo(connection, peer);

    const remainingAccounts = await this.getSendAccounts(srcChainKey, input.srcAddress, dstEid);

    const tokenProgramId = this.getTokenProgramId(srcChainKey);
    const oftProgramId = this.getOftProgramId(srcChainKey);

    const transactionInstruction = await OftTools.sendWithUln(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection as any,
      payer,
      tokenMint,
      tokenSource,
      dstEid,
      amountLd,
      minAmountLd,
      options.toBytes(),
      Array.from(to),
      nativeFee,
      lzTokenFee,
      tokenEscrow,
      composeMsg,
      peerInfo.address,
      remainingAccounts,
      tokenProgramId,
      oftProgramId,
    );
    return transactionInstruction;
  }

  // extracted so it can be cached (reduce RPC calls)
  protected getPeerInfo(connection: Connection, peer: PublicKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return OftProgram.accounts.Peer.fromAccountAddress(connection as any, peer);
  }

  protected getPeer(srcChainKey: ChainKey, dstEid: number): PublicKey {
    const oftInstance = this.getOftInstance(srcChainKey);
    const deriver = this.getDeriver(srcChainKey);
    const peer = deriver.peer(oftInstance, dstEid);
    return peer[0];
  }

  protected async getComputeUnitsLimit(
    connection: Connection,
    transactionInstruction: TransactionInstruction,
    input: TransferInput,
  ): Promise<number> {
    const payer = new PublicKey(input.srcAddress);
    const simulationComputeUnits = await getSimulationComputeUnits(
      connection,
      [transactionInstruction],
      payer,
      [],
    );
    const computeUnitsLimit =
      simulationComputeUnits === null
        ? 1000
        : simulationComputeUnits < 1000
          ? 1000
          : Math.ceil(simulationComputeUnits * 1.5);

    return computeUnitsLimit;
  }

  protected tryGetDeployment(chainKey: ChainKey) {
    return this.config.deployments[chainKey];
  }

  protected getDeployment(chainKey: ChainKey) {
    const deployment = this.tryGetDeployment(chainKey);
    if (deployment) return deployment;
    throw new Error(`Deployment not found for chainKey ${chainKey}`);
  }

  protected chainKeyToEndpointId(chainKey: string): number {
    const deployment = this.getDeployment(chainKey);
    return deployment.eid;
  }
}

export async function buildMessageV0(
  connection: Connection,
  payerKey: PublicKey,
  instructions: TransactionInstruction[],
  commitmentOrConfig?: Commitment | GetAccountInfoConfig,
  lookupTableAddresses?: AddressLookupTableAccount[],
): Promise<MessageV0> {
  return new TransactionMessage({
    payerKey: payerKey,
    recentBlockhash: await connection
      .getLatestBlockhash(commitmentOrConfig)
      .then((res) => res.blockhash),
    instructions: instructions,
  }).compileToV0Message(lookupTableAddresses);
}

export async function buildVersionedTransaction(
  connection: Connection,
  payerKey: PublicKey,
  instructions: TransactionInstruction[],
  commitmentOrConfig?: Commitment | GetAccountInfoConfig,
  lookupTableAddresses?: AddressLookupTableAccount[],
): Promise<VersionedTransaction> {
  return new VersionedTransaction(
    await buildMessageV0(
      connection,
      payerKey,
      instructions,
      commitmentOrConfig,
      lookupTableAddresses,
    ),
  );
}
