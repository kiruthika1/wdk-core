import {describe, it, test, expect, beforeAll, afterAll} from 'vitest';
import {
  type TenderlyConfig,
  TenderlyFork,
  TenderlyProvider,
  TenderlySdk,
  createTenderlyProviderFactory,
} from './tenderly';

const tenderlyConfig: TenderlyConfig = {
  accessKey: process.env.TENDERLY_ACCESS_KEY!,
  project: process.env.TENDERLY_PROJECT!,
  user: process.env.TENDERLY_USER!,
};

const tenderlySdk = new TenderlySdk(tenderlyConfig);

// TODO: run integration tests in separate workflow
describe.skip('TenderlyFork', () => {
  const fork = new TenderlyFork(tenderlyConfig, {
    chainKey: 'ethereum',
  });

  it.sequential('should start', async () => {
    await fork.start();
    expect(fork.forkId).toBeDefined();
  });

  describe.sequential('TenderlyProvider', () => {
    const provider = new TenderlyProvider(fork);
    test('getBalance', async () => {
      const balance = await provider.getBalance('0x6d9F1a927CBcb5e2c28D13CA735bc6d6131406da');
      expect(balance).toBeDefined();
    });
  });

  it.sequential('should stop', async () => {
    await fork.stop();
  });
});

// TODO: run integration tests in separate workflow
describe.skip('createTenderlyProviderFactory', () => {
  const providerFactory = createTenderlyProviderFactory(tenderlySdk);
  const chainKey = 'ethereum';

  beforeAll(async () => {
    await providerFactory(chainKey).startFork();
  });

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
