import { Contract } from 'ethers';
import { BridgeStargateOptions, SendParams, TransactionData } from './src/types';

export class BridgeStargate {
    constructor(options: BridgeStargateOptions);
    buildSendParam(chain: string, address: string, amount: number, nativeTokenDropAmount?: number): SendParams;
    getContract(): Contract;
    send(chain: string, address: string, amount: number, nativeFee: number, refundAddress: string, nativeTokenDropAmount?: number): TransactionData;
    quoteSend(chain: string, address: string, amount: number, nativeTokenDropAmount?: number): Promise<number>;
}

export * from './src/types'; 