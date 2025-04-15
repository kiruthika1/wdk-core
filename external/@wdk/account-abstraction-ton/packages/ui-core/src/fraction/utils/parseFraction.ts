import {Fraction} from '../fraction';
import {parseUnits} from './parseUnits';

export function parseFraction(value: string, decimals: number): Fraction {
  const parsed = parseUnits(value, decimals);
  const denominator = 10 ** decimals;
  return new Fraction(parsed, denominator);
}

export function tryParseFraction(value?: string, decimals: number = 4): Fraction | undefined {
  if (value === undefined) return undefined;
  try {
    return parseFraction(value, decimals);
  } catch {
    //
  }
  return undefined;
}
