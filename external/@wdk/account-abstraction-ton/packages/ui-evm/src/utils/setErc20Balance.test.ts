import {describe, it, beforeAll, afterAll, expect} from 'vitest';
import {createAnvil} from '@viem/anvil';
import {setErc20Balance} from './setErc20Balance';
import {JsonRpcProvider} from '@ethersproject/providers';
import {waitFor} from '@wdk-account-abstraction-ton/ui-core';

// TODO: run integration tests in separate workflow
describe.skip('setErc20Balance', () => {
  const forkUrl = 'https://cloudflare-eth.com';
  const timeout = 30_000;
  const chainId = 1;
  const anvil = createAnvil({
    forkUrl,
    timeout,
  });
  const anvilUrl = `http://${anvil.host}:${anvil.port}`;
  const forkProvider = new JsonRpcProvider(anvilUrl, chainId);
  const isAnvilReady = () => forkProvider.getBlock('latest').then(() => true);

  beforeAll(async () => {
    await anvil.start();
    await waitFor(isAnvilReady, {timeout, interval: 1_000});
  }, timeout);

  afterAll(async () => {
    await anvil.stop();
  }, timeout);

  it(
    'sets balance of USDC',
    async () => {
      const slot = await setErc20Balance(
        {
          token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          amount: BigInt(1e18),
          recipient: '0x1234567890123456789012345678901234567890',
        },
        forkProvider,
        {log: true},
      );
      expect(slot).toBeDefined();
    },
    {timeout},
  );
});
