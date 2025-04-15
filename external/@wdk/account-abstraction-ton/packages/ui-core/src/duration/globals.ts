import {DurationProvider} from './DurationProvider';
import {defaultConfig} from './defaultConfig';

export const durationProvider = new DurationProvider(defaultConfig);

export const getExpectedDate: typeof durationProvider.getExpectedDate = (
  ua,
  dstEid,
  sentTimestamp,
) => durationProvider.getExpectedDate(ua, dstEid, sentTimestamp);

export const getMessageDuration: typeof durationProvider.getMessageDuration = (ua, dstEid) =>
  durationProvider.getMessageDuration(ua, dstEid);
