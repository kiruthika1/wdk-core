import {Percent} from '../percent';
import {parseUnits} from './parseUnits';

export function parsePercent(value: string, decimals: number): Percent {
  const parsed = parseUnits(value, decimals);
  const denominator = 100 * 10 ** decimals;
  return new Percent(parsed, denominator);
}

export function tryParsePercent(value?: string, decimals: number = 4): Percent | undefined {
  if (value === undefined) return undefined;
  try {
    return parsePercent(value, decimals);
  } catch {
    //
  }
  return undefined;
}
