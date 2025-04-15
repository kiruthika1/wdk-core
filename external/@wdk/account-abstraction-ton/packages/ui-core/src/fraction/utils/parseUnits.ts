import {parseUnits as parseUnitsViem} from 'viem';

// throws when too many decimals
export function parseUnits(value: string, decimals: number): bigint {
  // parse first to throw early if invalid
  const result = parseUnitsViem(value, decimals);
  const [integer, fraction = ''] = value.split('.');
  // viem does not handle case when too many decimals are provided
  if (fraction.length > decimals) {
    const tail = fraction.substring(decimals); // should be all 0s
    if (BigInt(tail) > 0) {
      throw new Error('Too many decimal places');
    }
  }
  return result;
}
