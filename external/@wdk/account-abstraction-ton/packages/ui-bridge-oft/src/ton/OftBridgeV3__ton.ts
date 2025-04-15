import type {OftBridgeApi, OftBridgeConfig, OftBridgeDeployment, OftBridgeFee} from '../types';
import {
  buildTonTransferCell,
  createTransaction,
  parseTonAddress,
  TonContractWrapper,
  getJettonAddressFromWallet,
  TonSigner,
  TonBaseMinter,
  UsdtMinter,
  computeTonUlnAddress,
  computeTonEndpointAddress,
  bigIntToAddress,
  computeTonUlnConnectionAddress,
  addressToBigInt,
  computeTonChannelAddress,
} from '@wdk-account-abstraction-ton/ui-ton';
import {
  ApproveInput,
  type BridgeOption,
  BridgeOptions,
  BridgeOutput,
  ClaimInput,
  GetAllowanceInput,
  GetDurationInput,
  GetExtraGasInput,
  GetLimitInput,
  GetMessageFeeInput,
  GetOptionsInput,
  GetOutputInput,
  GetUnclaimedInput,
  IsRegisteredInput,
  PartialTransferInput,
  RegisterInput,
  Seconds,
  TransferInput,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import {
  assert,
  type ChainKey as ChainKeyType,
  Currency,
  CurrencyAmount,
  FeeQuote,
  Fraction,
  getMessageDuration,
  getNativeCurrency,
  isTonChainKey,
  isTronChainKey,
  MaxUint256,
  MessageFee,
  Token,
  Transaction,
} from '@wdk-account-abstraction-ton/ui-core';
import {Cell, OpenedContract, TonClient, Tuple, TupleItemCell} from '@ton/ton';
import {Address, beginCell, toNano} from '@ton/core';
import {ChainKey} from '@layerzerolabs/lz-definitions';
import {AddressConfig, LoadedUlnConfig} from './types';
import {
  buildClass,
  decodeClass,
  emptyCell,
  generateBuildClass,
  generateDecodeClass,
} from '@layerzerolabs/lz-ton-sdk-v2';
import {tonObjects} from './allObjects';
import memoryCache, {CacheClass} from 'memory-cache';
import {fromTronAddress} from '../tron';
import {replace} from 'lodash-es';
import {ulnConfigKey} from './utils';

const oftBuildClass = generateBuildClass(tonObjects);
const oftDecodeClass = generateDecodeClass(tonObjects);

const tmp = {
  confirmations: '5',
  confirmationsNull: false,
  executor: '0x0',
  executorNull: true,
  maxMessageBytes: '42',
  optionalDVNs: [],
  optionalDVNsNull: false,
  requiredDVNs: ['0x51a34d3bbc028705435c9154b79f86181fc44f960ae7d1d3fb4ad5a9de8c351a'],
  requiredDVNsNull: false,
  workerQuoteGasLimit: '120000',
};

// This is the Gas to get to the OApp. This is additional gas required on-top of the FWD_AMOUNT_GAS.
// Should be pretty trivial though. Should actually be ~0.5 so we get a bit back.
const JETTON_TRANSFER_GAS = 0.07;

export class OftBridgeV3__ton implements OftBridgeApi<TonSigner> {
  contract: OpenedContract<TonContractWrapper>;
  oAppAddress: Address;
  minterContract: OpenedContract<TonBaseMinter>;
  estimatedGasCost: bigint = 0n;

  // Create a feeCache because getting the fee takes a lot of rpc calls
  feeCache: CacheClass<string, Promise<FeeQuote>> = new memoryCache.Cache();

  constructor(
    protected readonly client: TonClient,
    public readonly config: OftBridgeConfig,
    protected readonly addressConfig: AddressConfig,
    protected readonly ulnConfigs: Record<string, LoadedUlnConfig>,
  ) {
    this.validateConfig(config);

    this.oAppAddress = parseTonAddress(this.addressConfig.oftProxy);

    // OFT is validated to exist already
    const wrapper = TonContractWrapper.create(this.oAppAddress);
    this.contract = this.client.provider(this.oAppAddress).open(wrapper);

    const tonMinterAddress = parseTonAddress(addressConfig.token);

    this.minterContract = this.client.open(UsdtMinter.createFromAddress(tonMinterAddress));
  }

  protected validateConfig(config: OftBridgeConfig) {
    assert(config.version === 3, 'OftBridgeConfig version 3 is required');
    // assert(!!config.deployments.ton, 'OftBridgeConfig must have a ton deployment');
    // assert(!!config.deployments.ton.token, 'OftBridgeConfig must have a ton oft');
  }

  approve(input: ApproveInput): Promise<Transaction<TonSigner>> {
    // Unlimited allowance means we don't need an approval
    throw new Error('Not Implemented');
  }

  claim(input: ClaimInput): Promise<Transaction<TonSigner>> {
    throw new Error('Not Implemented');
  }

  async getOutput(input: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    try {
      const [amount, fee] = await this.contract.getGetAmountAndFee(input.srcAmount.toBigInt());

      return {
        dstAmount: CurrencyAmount.fromBigInt(input.dstToken, amount),
        fee: {
          bridgeFee: CurrencyAmount.fromBigInt(
            getNativeCurrency(input.srcAmount.token.chainKey),
            fee,
          ),
        },
      };
    } catch (error) {
      return {
        dstAmount: input.srcAmount,
        fee: {
          bridgeFee: CurrencyAmount.fromBigInt(
            getNativeCurrency(input.srcAmount.token.chainKey),
            0n,
          ),
        },
      };
      // throw error;
    }
  }

  register(register: RegisterInput): Promise<Transaction<TonSigner>> {
    throw new Error('Not Implemented');
  }

  async createForwardPayload(input: PartialTransferInput<'dstChainKey' | 'dstAddress'>) {
    const {dstChainKey, dstAddress, fee, dstAmountMin, dstNativeAmount} = input;
    const nativeFee = fee?.nativeFee.toBigInt() ?? 0;

    let extraOptions = beginCell().endCell();
    if (dstNativeAmount && dstNativeAmount.greaterThan(0)) {
      extraOptions = buildClass('md::OptionsV1', {
        lzReceiveGas: 0n,
        lzReceiveValue: 0n,
        nativeDropAddress: BigInt(dstAddress),
        nativeDropAmount: dstNativeAmount.toBigInt(),
      });
    }

    let parsedDstAddress = dstAddress;
    if (isTronChainKey(dstChainKey)) {
      parsedDstAddress = '0x' + fromTronAddress(dstAddress);
    }

    return oftBuildClass('OFTSend', {
      dstEid: BigInt(this.tryGetDeployment(dstChainKey).eid),
      to: BigInt(parsedDstAddress),
      minAmount: dstAmountMin?.toBigInt() ?? toNano(0),
      nativeFee,
      zroFee: toNano(0), // Zro is not on TON so this will always be 0
      extraOptions,
      composeMessage: beginCell().storeUint(0, 1).endCell(),
    });
  }

  async createTransferBody(input: PartialTransferInput<'srcToken'>) {
    const {dstChainKey, dstAddress, fee, srcAmount, srcAddress, dstAmountMin, dstNativeAmount} =
      input;
    assert(dstChainKey, 'dstChainKey');
    assert(fee, 'fee');
    assert(dstAddress, 'dstAddress');
    assert(srcAddress, 'srcAddress');
    assert(srcAmount, 'srcAmount');
    assert(dstAmountMin, 'dstAmountMin');

    // The total gas + fees that will be supplied.
    const value = fee.nativeFee.toBigInt() + this.estimatedGasCost;
    const forwardPayload = await this.createForwardPayload({
      dstChainKey,
      dstAddress,
      dstAmountMin,
      fee,
      dstNativeAmount,
    });

    const srcWalletAddress = parseTonAddress(srcAddress);
    return buildTonTransferCell({
      toAddress: this.oAppAddress, // oApp Address
      fromAddress: srcWalletAddress,
      value,
      fwdAmount: value, // How much to forward from the usdt jetton wallet to the
      jettonAmount: srcAmount.toBigInt(),
      forwardPayload,
    });
  }

  async transfer(input: Required<TransferInput>): Promise<Transaction<TonSigner>> {
    const {srcAddress, fee} = input;
    const srcWalletAddress = parseTonAddress(srcAddress);

    this.estimatedGasCost = await this.getGasAsserts();

    const body = await this.createTransferBody(input);

    const jettonAddress = await getJettonAddressFromWallet(this.minterContract, srcWalletAddress);
    const amount = fee.nativeFee.toBigInt() + this.estimatedGasCost + toNano(JETTON_TRANSFER_GAS);
    const transaction = createTransaction(
      {
        messages: [
          {
            address: jettonAddress,
            amount: amount.toString(),
            payload: body,
          },
        ],
      },
      {
        client: this.client,
      },
    );
    return transaction;
  }

  async getGasAsserts() {
    const oftStorage = await this.client
      .provider(parseTonAddress(this.addressConfig.oftProxy))
      .get('getContractStorage', []);
    const oftCell = oftDecodeClass('UsdtOFT', oftStorage.stack.readCell());
    const gasAsserts = oftDecodeClass('GasAsserts', oftCell.gasAsserts);

    return gasAsserts.sendOFTGas * 440n; // Add 10% for buffer
  }

  getAllowance(input: GetAllowanceInput): Promise<CurrencyAmount> {
    // Ton doesn't need to approve
    return Promise.resolve(CurrencyAmount.fromRawAmount(input.token, MaxUint256));
  }

  getDuration(input: GetDurationInput): Promise<Seconds> {
    const {dstToken, srcToken} = input;
    const srcEid = this.tryGetDeployment(srcToken.chainKey).eid;
    const dstEid = this.tryGetDeployment(dstToken.chainKey).eid;
    const ua = {address: this.addressConfig.oftProxy, eid: srcEid};
    return getMessageDuration(ua, dstEid);
  }

  getExtraGas(input: GetExtraGasInput): Promise<number> {
    return Promise.resolve(0);
  }

  async getLimit(input: GetLimitInput): Promise<CurrencyAmount> {
    // Arbitrum, Celo, Eth, Ton, Tron
    const [arbCreds, celoCreds, ethCreds, tonCreds, tronCreds] =
      await this.contract.getGetAllCredits();
    switch (input.dstToken.chainKey) {
      case ChainKey.ARBITRUM:
      case ChainKey.ARBITRUM_SEPOLIA:
        return CurrencyAmount.fromRawAmount(input.srcToken, arbCreds);
      case ChainKey.CELO:
        return CurrencyAmount.fromRawAmount(input.srcToken, celoCreds);
      case ChainKey.ETHEREUM:
      case ChainKey.SEPOLIA:
        return CurrencyAmount.fromRawAmount(input.srcToken, ethCreds);
      case 'ton':
      case 'ton-testnet':
        return CurrencyAmount.fromRawAmount(input.srcToken, tonCreds);
      case ChainKey.TRON_TESTNET:
      case ChainKey.TRON:
      case ChainKey.TRONDEV:
      case ChainKey.TRON_SANDBOX:
        return CurrencyAmount.fromRawAmount(input.srcToken, tronCreds);
      default:
        return CurrencyAmount.fromRawAmount(input.srcToken, 0n);
    }
  }

  async getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote> {
    const {dstAddress} = input;
    if (!dstAddress) {
      return MessageFee.from(input.srcToken.chainKey, {
        nativeFee: 0n,
        zroFee: 0n,
      });
    }
    const body = await this.createTransferBody({
      ...input,
      fee: MessageFee.from(input.srcToken.chainKey, {
        nativeFee: 0n,
        zroFee: 0n,
      }),
    });

    // Getting
    const feeCacheKey = `${input.srcChainKey}-${input.dstChainKey}-${input.dstNativeAmount?.toBigInt() ?? 0}`;
    let promise = this.feeCache.get(feeCacheKey);
    if (!promise) {
      // Probably could do a lock here, but might be overkill
      promise = this.getLzMessageFee(input);
      await this.feeCache.put(feeCacheKey, promise, 1000 * 10);
    }
    return await promise;
  }

  async getLzMessageFee(input: GetMessageFeeInput): Promise<FeeQuote> {
    const {dstToken, srcToken, dstAddress, dstNativeAmount} = input;
    const dstChainKey = dstToken.chainKey;
    const dstDeployment = this.tryGetDeployment(dstToken.chainKey);
    const ulnAddress = bigIntToAddress(
      computeTonUlnAddress(BigInt(this.addressConfig.ulnManager), BigInt(dstDeployment.eid)),
    );

    const endpointAddress = bigIntToAddress(
      computeTonEndpointAddress(BigInt(this.addressConfig.controller), BigInt(dstDeployment.eid)),
    );

    const channelAddress = bigIntToAddress(
      computeTonChannelAddress(
        BigInt(this.addressConfig.oftProxy),
        BigInt(dstDeployment.eid),
        BigInt(dstDeployment.oftProxy?.address ?? ''),
        BigInt(this.addressConfig.controller),
        addressToBigInt(endpointAddress),
      ),
    );

    const lzSend = decodeClass(
      'md::LzSend',
      await this.contract.getLzSendMd(
        await this.createForwardPayload({
          dstChainKey: dstChainKey ?? '',
          dstAddress: dstAddress ?? '',
          dstNativeAmount,
        }),
      ),
    );

    const mdUlnSend = buildClass('md::UlnSend', {
      lzSend,
      customUlnSendConfig:
        this.ulnConfigs[ulnConfigKey('USDT', 'TON', dstChainKey)] ??
        (await this.getUlnConfig(dstDeployment)),
      connectionInitialStorage: beginCell().endCell(),
      forwardingAddress: channelAddress,
    });

    try {
      const quoteStack = (
        await this.client.provider(ulnAddress).get('ulnQuote', [
          {
            type: 'cell',
            cell: mdUlnSend,
          },
        ])
      ).stack;

      // For some reason these aren't actually tuples. It doesn't pop a tuple item, it is just an array. Actually an
      // array of Cells or bigints, but we only want to grab the Cell item, so just type it like this for now
      const parsedArray = quoteStack.readTuple().skip(1).pop() as unknown as Array<Cell>;
      const parsedQuoteCell = decodeClass('md::MsglibSendCallback', parsedArray[3]);
      const srcNativeToken = getNativeCurrency(srcToken.chainKey);
      const tenPercentMult = new Fraction(13, 10);
      return {
        // add 10% as a buffer. If it's not used it will just be returned to the user
        nativeFee: CurrencyAmount.fromBigInt(srcNativeToken, parsedQuoteCell.nativeFee).multiply(
          tenPercentMult,
        ),
        // This should always be 0 as ZRO isn't on Ton
        zroFee: CurrencyAmount.fromBigInt(srcNativeToken, parsedQuoteCell.zroFee).multiply(
          tenPercentMult,
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  async getUlnConfig(dstDeployment: OftBridgeDeployment) {
    const ulnAddress = bigIntToAddress(
      computeTonUlnAddress(BigInt(this.addressConfig.ulnManager), BigInt(dstDeployment.eid)),
    );

    const ulnConnectionAddress = bigIntToAddress(
      computeTonUlnConnectionAddress(
        // oftProxy is the ton oApp address
        BigInt(this.addressConfig.oftProxy),
        BigInt(dstDeployment.eid),
        BigInt(dstDeployment.oftProxy?.address ?? ''),
        BigInt(this.addressConfig.ulnManager),
        addressToBigInt(ulnAddress),
      ),
    );

    const ulnConnectionStorageResult = await this.client
      .provider(ulnConnectionAddress)
      .get('getContractStorage', []);

    const ulnConnectionStorage = decodeClass(
      'UlnConnection',
      ulnConnectionStorageResult.stack.readCell(),
    );

    return ulnConnectionStorage.UlnSendConfigOApp;
  }

  async getOptions(input: GetOptionsInput): Promise<BridgeOptions> {
    const taxiOption: BridgeOption = {
      mode: 'taxi',
    };
    return {options: [taxiOption]};
  }

  getUnclaimed(input: GetUnclaimedInput): Promise<CurrencyAmount> {
    return Promise.resolve(CurrencyAmount.fromRawAmount(input.token, 0));
  }

  isRegistered(input: IsRegisteredInput): Promise<boolean> {
    return Promise.resolve(false);
  }

  supportsClaim(currency: Currency): boolean {
    return false;
  }

  supportsRegister(currency: Currency): boolean {
    return false;
  }

  protected tryGetDeployment(chainKey: ChainKeyType) {
    return this.config.deployments[chainKey];
  }

  supportsTransfer(srcToken: Currency, dstToken: Currency): boolean {
    const srcDstChains = this.tryGetDeployment(srcToken.chainKey)?.destinationChains;
    if (srcDstChains) {
      if (!srcDstChains.includes(dstToken.chainKey)) {
        return false;
      }
    }
    return Boolean(
      isTonChainKey(srcToken.chainKey) &&
        this.tryGetDeployment(srcToken.chainKey)?.token.equals(srcToken) &&
        this.tryGetDeployment(dstToken.chainKey)?.token.equals(dstToken),
    );
  }
}
