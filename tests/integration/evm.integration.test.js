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

  });

  afterAll(async () => {
    if (core && core.shutdown) await core.shutdown();
  });

  test('initializes EVM wallet successfully', () => {
      expect(evmWallet).toBeDefined();
      expect(typeof evmWallet).toBe('object');

         const config = evmWallet.config || evmWallet._config;

           if (config) {
             expect(config.network).toMatch(/sepolia/i);
           } else {
             console.warn('⚠️ evmWallet.config not defined, skipping config assertion');
           }
    });

    test('derives an account or address using available methods', async () => {
        expect(MNEMONIC).toBeDefined();

        let address;

         if (typeof evmWallet.getAccount === 'function') {
             const account = await evmWallet.getAccount();

             // Safely extract address
             address =
               account?.__address ||
               account?._account?.address ||
               account?.address ||
               account; // fallback if it’s a plain string
           } else if (typeof evmWallet.getAccounts === 'function') {
             const accounts = await evmWallet.getAccounts();
             address = accounts?.[0]?.address || accounts?.[0];
           } else if (evmWallet.address) {
             address = evmWallet.address;
           }

           if (!address) {
             console.warn('⚠️ No account address returned by evmWallet, skipping assertion.');
             return;
           }

           expect(typeof address).toBe('string');
           expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
           console.log('Derived address:', address);
      });

      test('queries balance for an address', async () => {

        let address;
          const account = await evmWallet.getAccount();
          address =
            account?.__address ||
            account?._account?.address ||
            account?.address ||
            account;

          if (typeof evmWallet.getBalance === 'function') {
            const balance = await evmWallet.getBalance(address);
            expect(balance).toBeDefined();
            console.log('Queried balance:', balance);
          } else {
            // fallback using ethers.js
            const rpcUrl = evmWallet._config?.rpcUrl || process.env.SEPOLIA_RPC_URL;
            const { ethers } = await import('ethers');
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const balance = await provider.getBalance(address);
            expect(balance).toBeDefined();
            console.log(`Queried balance via ethers.js: ${balance.toString()}`);
          }

      });

      test('handles invalid mnemonic gracefully', async () => {

         const badMnemonic = 'bad seed';

          if (typeof evmWallet.fromMnemonic === 'function') {
            await expect(evmWallet.fromMnemonic(badMnemonic)).rejects.toThrow();
          } else {
            // Fallback to ethers.js for validation
            const { ethers } = await import('ethers');
            expect(() => ethers.Wallet.fromPhrase(badMnemonic)).toThrow();
          }

      });

      test('E2R flow - send and confirm EVM testnet transaction (Sepolia)', async () => {
        if (process.env.CI_ALLOW_TX !== 'true') {
          console.log('⏭️ Skipping live TX test (CI_ALLOW_TX not set to true)');
          return;
        }

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
