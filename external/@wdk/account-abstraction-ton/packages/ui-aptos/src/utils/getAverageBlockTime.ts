import {AptosClient} from 'aptos';

/**
 * @returns seconds
 */
const getAverageBlockTime = async (
  blockWindow: number,
  client = new AptosClient('https://fullnode.mainnet.aptoslabs.com/v1'),
) => {
  const ledgerInfo = await client.getLedgerInfo();
  const latestBlockNumber = Number(ledgerInfo.block_height);
  const previousBlock = await client.getBlockByHeight(latestBlockNumber - blockWindow, false);
  // aptos timestamp is microseconds
  const timeElapsedSec =
    Number(ledgerInfo.ledger_timestamp) / 1_000_000 -
    Number(previousBlock.block_timestamp) / 1_000_000;

  const averageBlockTimeSec = timeElapsedSec / blockWindow;
  return averageBlockTimeSec;
};
