import {coreModule} from '../core';
import type {ChainKey} from '../types/ChainKey';

export type DurationProviderConfig = {
  blockConfirmation: {[chainKey: string]: Seconds} & {default: Seconds};
  averageBlockTime: {[chainKey: string]: Seconds} & {default: Seconds};
  extraDelay: Seconds;
};

// todo: better naming ?
export class DurationProvider {
  constructor(protected config: DurationProviderConfig) {}

  setConfig(config: DurationProviderConfig) {
    this.config = config;
  }

  public async getExpectedDate(
    ua: UA,
    dstEid: number,
    sentTimestamp = getUnixTime(new Date()),
  ): Promise<UnixTimestamp> {
    const duration = await this.getMessageDuration(ua, dstEid);
    const expected = sentTimestamp + duration + this.config.extraDelay;
    return expected;
  }

  public async getMessageDuration(ua: UA, dstEid: number): Promise<Seconds> {
    const srcChainKey = this.endpointIdToChainKey(ua.eid);
    const dstChainKey = this.endpointIdToChainKey(dstEid);
    const [confirmations, srcBlockTime, dstBlockTime] = await Promise.all([
      this.getRequiredConfirmations(ua, dstEid),
      this.getAverageBlockTime(srcChainKey),
      this.getAverageBlockTime(dstChainKey),
    ]);

    return (confirmations + 1) * srcBlockTime + dstBlockTime * 2 + this.config.extraDelay;
  }

  public async getRequiredConfirmations(ua: UA, dstEid: number): Promise<Seconds> {
    const srcChainKey = this.endpointIdToChainKey(ua.eid);
    const dstChainKey = this.endpointIdToChainKey(dstEid);

    if (srcChainKey) {
      const confirmations = this.config.blockConfirmation[srcChainKey];
      if (confirmations) return confirmations;
    }
    return this.config.blockConfirmation.default;
  }

  // returns seconds
  public async getAverageBlockTime(chainKey: ChainKey): Promise<Seconds> {
    if (chainKey) {
      // @ts-ignore
      const blockTime = this.config.averageBlockTime[chainKey];
      if (blockTime) return blockTime;
    }
    return this.config.averageBlockTime.default;
  }

  protected endpointIdToChainKey(eid: number): ChainKey {
    return coreModule.endpointIdToChainKey(eid);
  }
}

function getUnixTime(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

type UnixTimestamp = number;

type Seconds = number;

type UA = {eid: number; address: string};
