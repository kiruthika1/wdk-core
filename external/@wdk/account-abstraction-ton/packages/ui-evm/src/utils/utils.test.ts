import {describe, test, expect} from 'vitest';
import {addressToBytes32} from './utils';
import {utils} from 'ethers';

describe('addressToBytes32', () => {
  test('solana', async () => {
    const {PublicKey} = await import('@solana/web3.js');

    const address = `CRCiokScTjYn66GUmVEteE5XuT2XR2eoUVysNTY6cT64`;
    const bytes32Expected = utils.hexlify(new PublicKey(address).toBytes());
    const bytes32Actual = utils.hexlify(addressToBytes32(address));

    expect(bytes32Actual).toEqual(bytes32Expected);
  });
});
