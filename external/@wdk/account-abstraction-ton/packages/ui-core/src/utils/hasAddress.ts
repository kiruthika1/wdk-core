export function hasAddress<T extends object>(obj: T): obj is T & {address: string} {
  return 'address' in obj && !!obj.address;
}
