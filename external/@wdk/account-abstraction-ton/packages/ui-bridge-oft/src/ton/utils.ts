import {replace} from 'lodash-es';

export function ulnConfigKey(oftName: string, srcChainKey: string, dstChainKey: string) {
  return `${oftName}_${replace(srcChainKey.toUpperCase(), '-', '_')}_${replace(dstChainKey.toUpperCase(), '-', '_')}`;
}
