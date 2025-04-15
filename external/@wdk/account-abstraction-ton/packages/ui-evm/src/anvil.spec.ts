import {describe, it, test, expect, beforeAll, afterAll} from 'vitest';
import {type AnvilFork, AnvilProvider, AnvilSdk, createAnvilProviderFactory} from './anvil';

const anvilSdk = new AnvilSdk({
  chains: {
    ethereum: {
      forkUrl: 'https://cloudflare-eth.com',
      startTimeout: 30_000,
    },
  },
});

// TODO: run integration tests in separate workflow
describe.skip('AnvilSdk', () => {
  let fork: AnvilFork;

  it.sequential('should create fork', {timeout: 10_000}, async () => {
    fork = await anvilSdk.createFork({chainKey: 'ethereum'});
    expect(fork).toBeDefined();
  });

  it.sequential('should start fork', {timeout: 30_000}, async () => {
    await fork.start();
    expect(fork.forkUrl).toBeDefined();
  });

  describe.sequential('AnvilProvider', () => {
    test.sequential('getBalance', {timeout: 10_000}, async () => {
      const provider = new AnvilProvider(fork);
      const balance = await provider.getBalance('0x6d9F1a927CBcb5e2c28D13CA735bc6d6131406da');
      expect(balance).toBeDefined();
    });
  });
});

// TODO: run integration tests in separate workflow
describe.skip('createAnvilProviderFactory', () => {
  const providerFactory = createAnvilProviderFactory(anvilSdk);
  const chainKey = 'ethereum';

  beforeAll(async () => {
    await providerFactory(chainKey).startFork();
  }, 30_000);

  afterAll(async () => {
    await providerFactory(chainKey).stopFork();
  });

  test('getBalance', async () => {
    const balance = await providerFactory(chainKey).getBalance(
      '0x6d9F1a927CBcb5e2c28D13CA735bc6d6131406da',
    );
    expect(balance).toBeDefined();
  });
});
