import {Address, OpenedContract} from '@ton/ton';
import {TonBaseMinter} from './wrappers/TonBaseMinter';

export const getJettonAddressFromWallet = (
  contract: OpenedContract<TonBaseMinter>,
  walletAddress: Address,
) => {
  return contract.getWalletAddress(walletAddress).then((jettonWalletAddress) => {
    return jettonWalletAddress;
  });
};
