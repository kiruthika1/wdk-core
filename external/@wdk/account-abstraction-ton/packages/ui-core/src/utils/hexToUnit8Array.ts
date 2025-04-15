export function hexToUnit8Array(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex.slice(2), 'hex'));
}
