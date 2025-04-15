const solanaAddressRegex = /^([1-9A-HJ-NP-Za-km-z]{32,44})$/;

export function isSolanaAddress(address: string): boolean {
  return solanaAddressRegex.test(address);
}
