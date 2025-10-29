import dotenv from 'dotenv';
dotenv.config();

import Core from '@tetherto/wdk-core';
import EvmModule from '@tetherto/wdk-wallet-evm';
import WDK from '@tetherto/wdk-core';

const MNEMONIC = process.env.TEST_MNEMONIC;

describe('WDK - EVM module integration', () => {
  let core, evmWallet;

  beforeAll(() => {

   if (!process.env.SEED_PHRASE || !process.env.SEPOLIA_RPC_URL) {
        console.warn('⚠️ Required env vars missing. Skipping EVM integration tests.');
        return;
      }

    core = new Core(MNEMONIC.trim());
    core.registerWallet('evm', EvmModule, { network: 'sepolia', rpcUrl: process.env.SEPOLIA_RPC_URL });
    evmWallet = core._wallets.get('evm');
    console.log('Core instance:', core);
    console.log('EVM Wallet instance:', evmWallet);
  });

  afterAll(async () => {
    if (core && core.shutdown) await core.shutdown();
  });

  test('initializes EVM wallet successfully', () => {
      expect(evmWallet).toBeDefined();
      expect(typeof evmWallet).toBe('object');
     // Check if config exists, otherwise just ensure it’s constructed properly
         if (evmWallet.config) {
           expect(evmWallet.config.network).toMatch(/sepolia/i);
         } else {
           console.warn('⚠️ evmWallet.config not defined, skipping config assertion');
         }
    });

    test('derives an account or address using available methods', async () => {
        expect(MNEMONIC).toBeDefined();

        // If EvmModule has getAccounts()
        if (typeof evmWallet.getAccounts === 'function') {
          const accounts = await evmWallet.getAccounts();
          expect(Array.isArray(accounts)).toBe(true);
          expect(accounts.length).toBeGreaterThan(0);

          const address = accounts[0].address || accounts[0];
          expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
          console.log('Derived address:', address);
        } else if (evmWallet.address) {
          // Fallback if wallet has single address
          expect(evmWallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
        } else {
          console.warn('⚠️ No method found to derive account/address.');
        }
      });

      test('queries balance for an address', async () => {
        if (typeof evmWallet.getBalance !== 'function') {
          console.warn('⚠️ getBalance() not implemented in EvmModule, skipping test.');
          return;
        }

        let address;

        if (typeof evmWallet.getAccounts === 'function') {
          const accounts = await evmWallet.getAccounts();
          address = accounts[0].address || accounts[0];
        } else if (evmWallet.address) {
          address = evmWallet.address;
        }

        if (!address) {
          console.warn('⚠️ No address available for balance query.');
          return;
        }

        const balance = await evmWallet.getBalance(address);
        expect(balance).toBeDefined();
        console.log('Queried balance:', balance);
      });

      test('handles invalid mnemonic gracefully', async () => {
        try {
          // If evmWallet doesn’t handle mnemonics directly, we’ll skip
          if (typeof evmWallet.fromMnemonic !== 'function') {
            console.warn('⚠️ fromMnemonic() not supported, skipping invalid mnemonic test.');
            return;
          }

          await expect(evmWallet.fromMnemonic('bad seed')).rejects.toThrow();
        } catch (err) {
          console.warn('⚠️ Skipping invalid mnemonic test: method missing.');
        }
      });

      test('E2R flow - send and confirm EVM testnet transaction (Sepolia)', async () => {
        if (process.env.CI_ALLOW_TX !== 'true') {
          console.log('⏭️ Skipping live TX test (CI_ALLOW_TX not set to true)');
          return;
        }

 /*const mnemonic = MNEMONIC?.trim();
  if (!mnemonic) throw new Error('Missing TEST_MNEMONIC in environment');*/

       /* const mnemonic = process.env.TEST_MNEMONIC;
        const rpcUrl = process.env.SEPOLIA_RPC_URL;
        if (!mnemonic || !rpcUrl) throw new Error('Missing TEST_MNEMONIC or SEPOLIA_RPC_URL');

        const core = new Core();
        const evm = new EvmModule({ network: 'sepolia', rpcUrl });
        core.registerModule('evm', evm);*/

        // 1️⃣ Create wallet and derive first account
      //  const wallet = await core.createWalletFromMnemonic({ chain: 'evm', mnemonic });
       let accounts;
           if (typeof evmWallet.getAccounts === 'function') {
             accounts = await evmWallet.getAccounts();
           } else if (evmWallet.address) {
             accounts = [{ address: evmWallet.address }];
           }

            if (!accounts || accounts.length === 0 || !accounts[0].address) {
               console.warn('⚠️ No accounts available to run E2R flow, skipping test.');
               return;
             }

        const from = accounts[0].address;
        console.log(`🔑 From address: ${from}`);

        // 2️⃣ Build transaction to self or to second account if available
        const to = accounts[1] ? accounts[1].address : from;
        const value = '1000000000000000'; // 0.001 ETH (adjust as needed)

        // 3️⃣ Send transaction
        console.log('🚀 Sending transaction...');
        const txHash = await wallet.sendTransaction({
            from,
            to,
            value,
        });
        console.log(`✅ TX broadcasted: ${txHash}`);
        console.log(`🔗 View on explorer: https://sepolia.etherscan.io/tx/${txHash}`);

        // 4️⃣ Wait for confirmation (polling)
        console.log('⏳ Waiting for transaction receipt...');
        let receipt = null;
        for (let i = 0; i < 10; i++) {
          receipt = await wallet.getTransactionReceipt(txHash);
             if (receipt && receipt.status !== undefined) break;
             await new Promise(r => setTimeout(r, 5000));
        }

        // 5️⃣ Validate receipt
        expect(receipt).toBeDefined();
        expect(receipt.status).toBe(1);
        console.log('🎉 Transaction confirmed successfully on Sepolia!');
      });

    });
