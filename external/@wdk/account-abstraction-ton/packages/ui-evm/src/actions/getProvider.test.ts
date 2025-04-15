import {expect, describe, test, vi} from 'vitest';
import {createGetPublicClient} from './getPublicClient';
import {createGetProvider} from './getProvider';
import {mainnet as ethereum} from 'viem/chains';
import {Contract} from 'ethers';

// TODO: run integration tests in separate workflow
describe.skip('getProvider', () => {
  const config = {chains: {ethereum}};
  const getPublicClient = createGetPublicClient({config});
  const getProvider = createGetProvider({getPublicClient});

  test('getBlockNumber', async () => {
    const provider = getProvider('ethereum');
    const blockNumber = await provider.getBlockNumber();
    expect(blockNumber).toBeGreaterThan(0);
  });

  test('multicallv3', async () => {
    const provider = getProvider('ethereum');
    const usdc = new Contract(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ['function balanceOf(address) external view returns (uint256)'],
      provider,
    );

    const fetchSpy = vi.spyOn(global, 'fetch');

    const balances = await Promise.allSettled([
      provider.getBalance('0x0000000000000000000000000000000000000000'),
      usdc.balanceOf('0x0000000000000000000000000000000000000001'),
      usdc.balanceOf('0x0000000000000000000000000000000000000002'),
      usdc.balanceOf('0x0000000000000000000000000000000000000003'),
      usdc.balanceOf('0x0000000000000000000000000000000000000004'),
      usdc.balanceOf('0x0000000000000000000000000000000000000005'),
      usdc.balanceOf('0x0000000000000000000000000000000000000006'),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(balances.every((result) => result.status === 'fulfilled')).toBe(true);
  });
});
