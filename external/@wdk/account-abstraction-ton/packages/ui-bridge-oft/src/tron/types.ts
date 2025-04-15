import type {TransferInput} from '@wdk-account-abstraction-ton/ui-bridge-sdk/v1';

export interface TronWebProvider {
  contract: (abi?: any[], address?: string) => any;
  transactionBuilder: {
    triggerSmartContract: (
      contractAddress: string,
      functionSelector: string,
      options: {
        feeLimit: number;
        callValue: number;
        owner_address?: string;
        from?: string;
      },
      parameters?: any[],
    ) => Promise<{
      transaction: any;
      result: {
        result: boolean;
      };
    }>;
  };
  address: {
    fromHex(hexAddress: string): string;
    toHex(address: string): string;
  };
  trx: {
    sign(transaction: any): Promise<any>;
  };
}

export interface TronContract {
  quoteOFT(params: any): {
    call(options: TronCallOptions): Promise<{
      oftReceipt: {
        amountReceivedLD: string;
        amountSentLD: string;
      };
    }>;
  };
  quoteSend(
    params: any,
    useZro: boolean,
  ): {
    call(options: TronCallOptions): Promise<{
      nativeFee: string;
      lzTokenFee: string;
    }>;
  };
  send(
    params: any,
    fee: any,
    address: string,
  ): {
    send(options: TronSendOptions): Promise<any>;
  };
}

export interface TronCallOptions {
  _isConstant: boolean;
  callValue: number;
  feeLimit: number;
  from?: string;
  owner_address?: string;
}

export interface TronSendOptions {
  callValue: bigint;
  feeLimit: number;
  from: string;
  owner_address: string;
}

export type SendParamsInput = Pick<
  TransferInput,
  'adapterParams' | 'dstToken' | 'srcAmount' | 'dstAmountMin' | 'dstAddress'
>;
