export function unit8ArrayToHex(value: Uint8Array): string {
  // biome-ignore lint/style/useTemplate: <explanation>
  return '0x' + Buffer.from(value).toString('hex');
}
