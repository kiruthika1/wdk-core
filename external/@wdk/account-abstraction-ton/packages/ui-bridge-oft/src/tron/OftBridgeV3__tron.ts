import type {
  BridgeOutput,
  GetExtraGasInput,
  GetMessageFeeInput,
  GetOptionsInput,
  GetOutputInput,
  TransferInput,
  BridgeOptions,
  GetAllowanceInput,
  ApproveInput,
  GetLimitInput,
} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';
import {
  AdapterParams,
  assert,
  castCurrencyAmountUnsafe,
  type ChainKey,
  CurrencyAmount,
  type FeeQuote,
  getNativeCurrency,
  MessageFee,
  parseCurrencyAmount,
  type Transaction,
  Currency,
  isTronChainKey,
} from '@wdk-account-abstraction-ton/ui-core';
import {AddressOne, AddressZero} from '@wdk-account-abstraction-ton/ui-evm';

import type {SendParamStruct} from '../typechain/OFTV3';
import type {OftBridgeConfig, OftBridgeFee} from '../types';
import {createOptions, addressToBytes32ForChain} from '../utils';
import {OftBridgeBase} from '../evm/impl/OftBridgeBase';
import type {SendParamsInput, TronWebProvider} from './types';
import {toTronAddress} from './utils';
import {
  TRON_OFT_ABI,
  TRC20_ABI,
  VIEW_CALL_OPTIONS,
  SEND_CALL_OPTIONS,
  DEFAULT_FEE_LIMIT,
} from './constants';

export class OftBridgeV3__tron extends OftBridgeBase {
  constructor(
    protected getTronWeb: (chainKey: ChainKey) => Promise<TronWebProvider>,
    public config: OftBridgeConfig,
  ) {
    super(null as any, config);
  }

  protected validateConfig(config: OftBridgeConfig): asserts config is OftBridgeConfig {
    assert(config.version === 3, 'Invalid config.version: is not 3');
  }

  override supportsRegister(token: Currency): boolean {
    const {chainKey} = token;
    if (!isTronChainKey(chainKey)) return false;
    return Boolean(this.tryGetDeployment(token.chainKey)?.token.equals(token));
  }

  override supportsTransfer(srcToken: Currency, dstToken: Currency): boolean {
    if (!isTronChainKey(srcToken.chainKey)) return false;
    const srcDstChains = this.tryGetDeployment(srcToken.chainKey)?.destinationChains;
    if (srcDstChains) {
      if (!srcDstChains.includes(dstToken.chainKey)) {
        return false;
      }
    }
    return Boolean(
      this.tryGetDeployment(srcToken.chainKey)?.token.equals(srcToken) &&
        this.tryGetDeployment(dstToken.chainKey)?.token.equals(dstToken),
    );
  }

  override async transfer(input: TransferInput): Promise<Transaction<any>> {
    this.validateInput(input);

    const {srcChainKey, srcAddress} = input;
    const contract = await this.getContract(srcChainKey);

    // Use the actual fee from input
    const value = input.fee.nativeFee.toBigInt();
    const native = getNativeCurrency(srcChainKey);

    const sendParams = await this.buildSendParams(input);
    const fee = {
      nativeFee: input.fee.nativeFee.toBigInt(),
      lzTokenFee: input.fee.zroFee.toBigInt(),
    };

    // Structure the parameters with _sendParam nesting like quoteSend
    const params = {
      _sendParam: {
        dstEid: sendParams.dstEid,
        to: sendParams.to,
        amountLD: sendParams.amountLD.toString(),
        minAmountLD: sendParams.minAmountLD.toString(),
        extraOptions: sendParams.extraOptions,
        composeMsg: '0x',
        oftCmd: '0x',
      },
    };

    const contractCall = contract.send(params, fee, srcAddress).send({
      callValue: value,
      feeLimit: DEFAULT_FEE_LIMIT,
      from: srcAddress,
      owner_address: srcAddress,
      shouldPollResponse: false,
    });

    return {
      signAndSubmitTransaction: async () => {
        try {
          const result = await contractCall;

          if (!result) {
            throw new Error('No transaction response received');
          }

          // According to Tron protocol, transaction should have txID
          if (typeof result === 'object' && 'txID' in result) {
            const txHash = '0x' + result.txID;
            return {
              txHash,
              wait: async () => ({txHash}),
            };
          }

          // For other response formats
          if (typeof result === 'string') {
            return {
              txHash: '0x' + result,
              wait: async () => ({txHash: result}),
            };
          }

          throw new Error('Invalid transaction response format');
        } catch (error) {
          throw error;
        }
      },
      estimateGas: async () => BigInt(1000000),
      estimateNative: async () => CurrencyAmount.fromRawAmount(native, value),
      unwrap: () => contractCall,
    };
  }

  override async getMessageFee(input: GetMessageFeeInput): Promise<FeeQuote> {
    const dstAddress = input.dstAddress ?? AddressOne;
    const srcAmount = input.srcAmount ?? parseCurrencyAmount(input.srcToken, '1');
    const dstAmountMin = input.dstAmountMin ?? CurrencyAmount.fromBigInt(input.dstToken, BigInt(0));
    const srcChainKey = input.srcToken.chainKey;
    const useZro = false;

    const contract = await this.getContract(srcChainKey);
    const params = await this.buildSendParams({
      adapterParams: input.adapterParams,
      dstToken: input.dstToken,
      srcAmount,
      dstAmountMin,
      dstAddress,
    });

    try {
      const response = await contract
        .quoteSend(
          {
            _sendParam: {
              dstEid: params.dstEid,
              to: params.to,
              amountLD: params.amountLD.toString(),
              minAmountLD: params.minAmountLD.toString(),
              extraOptions: params.extraOptions,
              composeMsg: '0x',
              oftCmd: '0x',
            },
          },
          useZro,
        )
        .call({
          _isConstant: true,
          callValue: 0,
          feeLimit: 1000000,
          from: AddressZero,
          owner_address: AddressZero,
        });

      const fee: FeeQuote = MessageFee.from(srcChainKey, {
        nativeFee: BigInt(response.nativeFee.toString()),
        zroFee: BigInt(response.lzTokenFee.toString()),
      });

      return fee;
    } catch (error) {
      console.error('Error getting message fee:', error);
      // Use a reasonable default fee of 5 TRX
      const native = getNativeCurrency(srcChainKey);
      return {
        nativeFee: CurrencyAmount.fromRawAmount(native, BigInt(5e6)), // 5 TRX
        zroFee: CurrencyAmount.fromRawAmount(native, 0n),
      };
    }
  }

  // We do not need to get the enforced options from the contract, they are already applied.
  override async getExtraGas(input: GetExtraGasInput): Promise<number> {
    return 0;
  }

  override async getOutput(input: GetOutputInput): Promise<BridgeOutput<OftBridgeFee>> {
    const {srcAmount, dstToken} = input;
    const contract = await this.getContract(srcAmount.token.chainKey);

    const dstEid = this.chainKeyToEndpointId(dstToken.chainKey);
    const toAddress = addressToBytes32ForChain(AddressZero, dstToken.chainKey);
    const amountLD = srcAmount.toBigInt();
    const minAmountLD = srcAmount.toBigInt() / 2n;
    const extraOptions = '0x';

    const sendParam = {
      _sendParam: {
        dstEid,
        to: toAddress,
        amountLD: amountLD.toString(),
        minAmountLD: minAmountLD.toString(),
        extraOptions,
        composeMsg: '0x',
        oftCmd: '0x',
      },
    };

    try {
      const {oftReceipt} = await contract.quoteOFT(sendParam).call(VIEW_CALL_OPTIONS);
      // The received amount should be the same as sent for USDT
      return {
        dstAmount: CurrencyAmount.fromRawAmount(dstToken, oftReceipt.amountReceivedLD),
        fee: {
          bridgeFee: CurrencyAmount.fromRawAmount(srcAmount.token, '0'),
        },
      };
    } catch (error) {
      console.error('Error in getOutput:', error);
      // Return 1:1 ratio for the transfer
      return {
        dstAmount: CurrencyAmount.fromRawAmount(dstToken, amountLD),
        fee: {
          bridgeFee: CurrencyAmount.fromRawAmount(srcAmount.token, '0'),
        },
      };
    }
  }

  private async buildSendParams(input: SendParamsInput): Promise<SendParamStruct> {
    const {dstToken, srcAmount, adapterParams, dstAddress} = input;
    const dstChainKey = dstToken.chainKey;
    const dstEid = this.chainKeyToEndpointId(dstChainKey);

    // If dstAmountMin is provided, use it, otherwise default to half of srcAmount
    const minAmount = input.dstAmountMin
      ? castCurrencyAmountUnsafe(input.dstAmountMin, srcAmount.token)
      : CurrencyAmount.fromRawAmount(srcAmount.token, srcAmount.toBigInt() / 2n);

    const options = await this.createOptions({adapterParams, dstChainKey});

    return {
      dstEid: BigInt(dstEid),
      to: addressToBytes32ForChain(dstAddress, dstChainKey),
      amountLD: srcAmount.toBigInt(),
      minAmountLD: minAmount.toBigInt(),
      extraOptions: options.toHex(),
      composeMsg: '0x', // No compose message by default
      oftCmd: '0x', // No OFT command by default
    };
  }

  // The extra gas value in AdapterParams can be ignored because the extra gas is already
  // enforced and automatically applied to the tx. We only need to serialize the dst native amount
  // and address, which only exist in our AdapterParams V2.
  public async createOptions({
    adapterParams,
    dstChainKey,
  }: {
    adapterParams: AdapterParams;
    dstChainKey: ChainKey;
  }) {
    return createOptions({adapterParams, dstChainKey}, this.config);
  }

  override async getLimit({srcToken, dstToken}: GetLimitInput) {
    // Get credits for the destination chain
    const contract = await this.getContract(srcToken.chainKey);
    return CurrencyAmount.fromBigInt(
      srcToken,
      await contract.credits(this.getDeployment(dstToken.chainKey).eid).call(),
    );
  }

  protected async getContract(chainKey: ChainKey) {
    const {oftProxy, oft} = this.getDeployment(chainKey);
    const tronWeb = await this.getTronWeb(chainKey);

    const address = toTronAddress(tronWeb, oftProxy ? oftProxy.address : oft!.address);

    // Create contract instance with ABI and address
    const contract = await tronWeb.contract(TRON_OFT_ABI, address);

    // Create a proxy object that mimics the contract interface
    return {
      credits: (dstEid: number) => ({
        call: async (): Promise<bigint> => {
          // Get credits for the destination chain
          const creditsResult = await contract.credits(dstEid).call(SEND_CALL_OPTIONS);
          return BigInt(creditsResult.credits._hex);
        },
      }),
      quoteOFT: (params: any) => ({
        call: async (options: any) => {
          if (!params._sendParam) {
            throw new Error('Missing required parameters for quoteOFT');
          }

          // Convert parameters to array format for Tron contract
          const sendParamArray = [
            params._sendParam.dstEid,
            params._sendParam.to,
            params._sendParam.amountLD.toString(),
            params._sendParam.minAmountLD.toString(),
            params._sendParam.extraOptions,
            params._sendParam.composeMsg,
            params._sendParam.oftCmd,
          ];

          const result = await contract.quoteOFT(sendParamArray).call(SEND_CALL_OPTIONS);

          return {
            oftReceipt: {
              amountReceivedLD: result.oftReceipt.amountReceivedLD.toString(),
              amountSentLD: result.oftReceipt.amountSentLD.toString(),
            },
          };
        },
      }),

      quoteSend: (params: any, payInLzToken: boolean) => ({
        call: async (options: any) => {
          if (!params._sendParam) {
            throw new Error('Missing required parameters for quoteSend');
          }

          // Convert parameters to array format for Tron contract
          const sendParamArray = [
            params._sendParam.dstEid,
            params._sendParam.to,
            params._sendParam.amountLD.toString(),
            params._sendParam.minAmountLD.toString(),
            params._sendParam.extraOptions,
            params._sendParam.composeMsg,
            params._sendParam.oftCmd,
          ];

          const result = await contract
            .quoteSend(sendParamArray, payInLzToken)
            .call(SEND_CALL_OPTIONS);

          return {
            nativeFee: result.msgFee.nativeFee.toString(),
            lzTokenFee: result.msgFee.lzTokenFee.toString(),
          };
        },
      }),

      send: (params: any, fee: any, refundAddress: string) => ({
        send: async (options: any) => {
          if (!params || !fee || !refundAddress) {
            throw new Error('Missing required parameters for send');
          }

          // Convert parameters to array format for Tron contract
          const sendParamArray = [
            params._sendParam.dstEid,
            params._sendParam.to,
            params._sendParam.amountLD,
            params._sendParam.minAmountLD,
            params._sendParam.extraOptions,
            params._sendParam.composeMsg,
            params._sendParam.oftCmd,
          ];

          const feeArray = [fee.nativeFee.toString(), fee.lzTokenFee.toString()];

          // Call the contract method to create the transaction
          const transaction = await contract.send(sendParamArray, feeArray, refundAddress).send({
            ...options,
            feeLimit: DEFAULT_FEE_LIMIT,
          });

          return transaction;
        },
      }),
    };
  }

  override async getOptions(input: GetOptionsInput): Promise<BridgeOptions> {
    return {
      options: [
        {
          mode: 'taxi',
        },
      ],
    };
  }

  override async getAllowance({token, address}: GetAllowanceInput): Promise<CurrencyAmount> {
    if (!this.supportsRegister(token)) {
      return CurrencyAmount.fromRawAmount(token, 0n);
    }

    const tronWeb = await this.getTronWeb(token.chainKey);
    const deployment = this.getDeployment(token.chainKey);

    // Use oftProxy address as spender
    const spender = deployment.oftProxy?.address;
    if (!spender) {
      console.error('Missing spender:', {spender});
      return CurrencyAmount.fromRawAmount(token, 0n);
    }

    // Get token contract address from the deployment configuration
    const tokenDeployment = deployment.token;
    if (!('address' in tokenDeployment)) {
      console.error('Token is not a contract (no address)');
      return CurrencyAmount.fromRawAmount(token, 0n);
    }

    // Convert addresses to Tron format
    const tronTokenAddress = toTronAddress(tronWeb, tokenDeployment.address);
    const tronSpenderAddress = toTronAddress(tronWeb, spender);

    try {
      // Get the TRC20 token contract
      const tokenContract = await tronWeb.contract(TRC20_ABI, tronTokenAddress);

      const result = await tokenContract
        .allowance(address, tronSpenderAddress)
        .call(VIEW_CALL_OPTIONS);

      return CurrencyAmount.fromRawAmount(token, BigInt(result.toString()));
    } catch (error) {
      console.error('Error getting allowance:', error);
      return CurrencyAmount.fromRawAmount(token, 0n);
    }
  }

  override async approve({amount, address}: ApproveInput): Promise<Transaction<any>> {
    if (!this.supportsRegister(amount.token)) {
      throw new Error('Token not supported');
    }

    const tronWeb = await this.getTronWeb(amount.token.chainKey);
    const deployment = this.getDeployment(amount.token.chainKey);

    // Use oftProxy address as spender
    const spender = deployment.oftProxy?.address;
    if (!spender) {
      throw new Error('Missing spender address');
    }

    // Get token contract address from the deployment configuration
    const tokenDeployment = deployment.token;
    if (!('address' in tokenDeployment)) {
      throw new Error('Token is not a contract (no address)');
    }

    // Convert addresses to Tron format
    const tronTokenAddress = toTronAddress(tronWeb, tokenDeployment.address);
    const tronSpenderAddress = toTronAddress(tronWeb, spender);

    try {
      // Get the TRC20 token contract
      const tokenContract = await tronWeb.contract(TRC20_ABI, tronTokenAddress);

      return tokenContract.approve(tronSpenderAddress, amount.toBigInt()).send({
        ...SEND_CALL_OPTIONS,
        from: address,
        owner_address: address,
      });
    } catch (error) {
      console.error('Error in approve:', error);
      throw error;
    }
  }
}
