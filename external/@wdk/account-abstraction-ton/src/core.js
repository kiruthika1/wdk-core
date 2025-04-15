/**
 * @fileoverview Account Abstraction Service for TON blockchain
 * @module WDKAccountAbstractionTON
 */
const { Buffer } = require('buffer');
const { WalletContractV5R1, TonClient } = require('@ton/ton');
const { Address, beginCell, internal, toNano, SendMode, external, storeMessage, Cell } = require('@ton/core');
const { BridgeOperations } = require('./bridge.js');
const { TonApiClient } = require("@ton-api/client");
/**
 * Configuration object for TON Account Abstraction
 * @typedef {Object} TonConfig
 * @property {string} tonApiEndpoint - Base URL for TON API
 * @property {string} tonCenterEndpoint - TON endpoint URL
 * @property {string} tonApiKey - Optional API key for TON API
 * @property {string} tonCenterApiKey - Optional API key for TON Center API
 * @property {Object} paymasterToken - Paymaster token configuration
 * @property {string} paymasterToken.address - Paymaster token contract address
 */

/**
 * Basic wallet interface that only requires address and privateKey
 * @typedef {Object} BasicWallet
 * @property {string} address - The wallet's address
 * @property {string} privateKey - The wallet's private key
 */

/**
 * Service class for handling account abstraction operations on TON blockchain
 */
class WDKAccountAbstractionTON {
  /**
   * Creates an instance of WDKAccountAbstractionTON
   * @param {TonConfig} config - Configuration for TON Account Abstraction
   */
  constructor(config) {
    this.config = config;
    this.tonApiEndpoint = config.tonApiEndpoint || 'https://tonapi.io/v2';
    this.tonCenterEndpoint = config.tonCenterEndpoint || 'https://toncenter.com/api/v2/jsonRPC';
    this.tonApiKey = config.tonApiKey;
    this.paymasterToken = config.paymasterToken;
    this.tonCenterClient = new TonClient({ 
      endpoint: this.tonCenterEndpoint,
      apiKey: config.tonCenterApiKey
    });
    this.tonApiClient = new TonApiClient({
      apiKey: this.tonApiKey
    });
    this.bridgeOps = new BridgeOperations(this.tonCenterClient, this);
  }

  /**
   * Initializes a wallet from mnemonic
   * @param {KeyPair} keyPair - Wallet key pair
   * @returns {Promise<BasicWallet>} Initialized wallet instance
   */
  async initializeWallet(keyPair) {
    const wallet = WalletContractV5R1.create({ 
      workchain: 0, 
      publicKey: keyPair.publicKey 
    });
    
    return {
      address: wallet.address.toString({bounceable: false}),
      privateKey: keyPair.secretKey,
      contract: this.tonCenterClient.open(wallet)
    };
  }

  /**
   * Creates a transfer transaction
   * @param {Object} opts - Transfer options
   * @param {BasicWallet} opts.wallet - Wallet instance
   * @param {string} opts.recipient - Recipient address
   * @param {bigint} opts.amount - Amount to transfer
   * @returns {Promise<Object>} Transfer transaction
   */
  async createTransfer(opts) {
    const { wallet, recipient, amount } = opts;
    const seqno = await wallet.contract.getSeqno();
    const destAddress = Address.parse(recipient);

    return wallet.contract.createTransfer({
      seqno,
      secretKey: wallet.privateKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: destAddress,
          value: amount,
        })
      ]
    });
  }

  /**
   * Gets the relay address for gasless transfers
   * @private
   * @returns {Promise<Address>} Relay address
   */
  async _getRelayAddress() {
    const cfg = await fetch(`${this.tonApiEndpoint}/gasless/config`).then(res => res.json());
    return Address.parse(cfg.relay_address);
  }

  /**
   * Initiates a cross-chain token transfer
   * @param {Object} opts - Bridge operation options
   * @param {string} opts.address - Source address
   * @param {string} opts.receiver - Destination address
   * @param {string} opts.targetChain - Target chain ('ethereum', 'arbitrum', or 'tron')
   * @param {string} opts.nativeTokenDropAmount - Amount of native token to drop on destination chain
   * @param {boolean} [opts.simulate] - Whether to simulate the transaction
   * @param {Buffer} opts.publicKey - Public key buffer
   * @param {Buffer} opts.privateKey - Private key buffer
   * @param {number} opts.amount - Amount to transfer
   * @returns {Promise<Object>} Transaction result containing hash, gas cost, and bridging cost
   */
  async bridge(opts) {
    return this.bridgeOps.bridge(opts);
  }

  /**
   * Quotes a bridge operation to estimate costs
   * @param {Object} opts - Bridge operation options
   * @param {string} opts.address - Source address
   * @param {string} opts.receiver - Destination address
   * @param {string} opts.targetChain - Target chain ('ethereum', 'arbitrum', or 'tron')
   * @param {string} opts.nativeTokenDropAmount - Amount of native token to drop on destination chain
   * @param {Buffer} opts.publicKey - Public key buffer
   * @param {Buffer} opts.privateKey - Private key buffer
   * @param {number} opts.amount - Amount to transfer
   * @returns {Promise<Object>} Quote result containing estimated costs
   */
  async quoteBridge(opts) {
    return this.bridgeOps.quoteBridge(opts);
  }

  /**
   * Gets the balance of a jetton wallet
   * @param {Address} jettonAddress - The jetton master contract address
   * @param {Address} walletAddress - The wallet address to check balance for
   * @returns {Promise<bigint>} The jetton balance
   */
  async getJettonBalance(jettonAddress, walletAddress) {
    const response = await fetch(
      `${this.tonApiEndpoint}/blockchain/accounts/${jettonAddress}/methods/get_wallet_address?args=${walletAddress}`
    ).then(res => res.json());
    
    const jettonWalletAddress = Address.parse(response.decoded.jetton_wallet_address);
    const balanceResponse = await fetch(
      `${this.tonApiEndpoint}/blockchain/accounts/${jettonWalletAddress}/methods/get_wallet_data`
    ).then(res => res.json());

    if (balanceResponse.error) {
      return BigInt(0);
    }
    
    return BigInt(balanceResponse.decoded.balance);
  }

  /**
   * Gets the jetton wallet address for a given key pair and jetton master contract
   * @param {Object} keyPair - The key pair containing the public key
   * @param {Address} jettonAddress - The jetton master contract address
   * @returns {Promise<Address>} The jetton wallet address
   */
  async getJettonWalletAddress(keyPair, jettonAddress) {
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });
    
    const response = await fetch(
      `${this.tonApiEndpoint}/blockchain/accounts/${jettonAddress}/methods/get_wallet_address?args=${wallet.address}`
    ).then(res => res.json());
    
    return Address.parse(response.decoded.jetton_wallet_address);
  }

  /**
   * Sends a gasless transaction using the TON gasless service
   * This method allows users to send transactions without paying gas fees directly,
   * as the gas costs are paid in a different token (jetton) through a paymaster contract
   * 
   * @param {Object} keyPair - The key pair containing public and private keys
   * @param {Buffer} keyPair.publicKey - The public key buffer
   * @param {Buffer} keyPair.secretKey - The private key buffer
   * @param {string} boc - The base64 encoded transaction BOC (Bag of Cells)
   * @param {string} jettonMasterAddress - The jetton master contract address
   * @param {Object} opts - Additional options for the transaction
   * @param {boolean} [opts.simulate=false] - Whether to simulate the transaction without actually sending it
   * @returns {Promise<Object>} Transaction result containing:
   *   - hash: Transaction hash (null if simulated)
   *   - commission: The commission amount in jetton tokens
   * @throws {Error} If there's insufficient jetton balance to cover the commission
   */
  async sendGaslessTransaction (keyPair, boc, jettonMasterAddress, opts) {
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    })

    const params = await this.tonApiClient.gasless.gaslessEstimate(
      jettonMasterAddress,
      {
        walletAddress: wallet.address,
        walletPublicKey: keyPair.publicKey.toString('hex'),
        messages: [{ boc }]
      }
    )

    if (opts.simulate) {
      return {
        hash: null,
        commission: params.commission
      }
    }

    const jettonMasterBalance = await this._getJettonBalance(
      jettonMasterAddress,
      wallet.address
    )

    if (jettonMasterBalance < params.commission) {
      throw new Error('Not enough jetton master balance.')
    }

    const contract = this.contractAdapter.open(wallet)

    const seqno = await contract.getSeqno()

    const transfer = wallet.createTransfer({
      seqno,
      authType: 'internal',
      timeout: Math.ceil(Date.now() / 1_000) + 1 * 60,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: params.messages.map(message =>
        internal({
          to: message.address,
          value: BigInt(message.amount),
          body: message.payload
        })
      )
    })

    const message = beginCell()
      .storeWritable(
        storeMessage(
          external({
            init: seqno == 0 ? contract.init : undefined,
            to: contract.address,
            body: transfer
          })
        )
      )
      .endCell()

    await this.tonApiClient.gasless
      .gaslessSend({
        walletPublicKey: keyPair.publicKey.toString('hex'),
        boc: message
      })

    return {
      hash: null,
      commission: params.commission
    }
  }

  /**
   * Sends a gasless jetton transfer
   * @param {Object} opts - Transfer options
   * @param {Buffer} opts.publicKey - Public key buffer
   * @param {Buffer} opts.privateKey - Private key buffer
   * @param {string} opts.recipient - Recipient address
   * @param {BigInt} opts.amount - Amount to transfer
   * @param {string} opts.jettonMaster - Jetton master contract address
   * @param {boolean} [opts.simulate=false] - Whether to simulate the transfer
   * @returns {Promise<Object>} Transfer result containing transaction hash and costs
   */
  async send(opts) {
    const { publicKey, privateKey, recipient, amount, jettonMaster, simulate = false } = opts;
    const destAddress = Address.parse(recipient);
    const jettonMasterAddress = Address.parse(jettonMaster);

    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey
    });
    const contract = this.tonCenterClient.open(wallet);

    const jettonWalletAddressResult = await this.tonApiClient.blockchain.execGetMethodForBlockchainAccount(
      jettonMasterAddress,
      "get_wallet_address",
      {
        args: [wallet.address.toRawString()],
      }
    );

    const jettonWallet = Address.parse(
      jettonWalletAddressResult.decoded.jetton_wallet_address
    );

    const relayerAddress = await this._getRelayAddress();

    const jettonTransferPayload = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(amount)
      .storeAddress(destAddress)
      .storeAddress(relayerAddress)
      .storeBit(false)
      .storeCoins(1n)
      .storeMaybeRef(undefined)
      .endCell();

    const messageToEstimate = beginCell()
      .storeWritable(
        storeMessage(
          internal({
            to: jettonWallet,
            bounce: true,
            value: toNano(0.05),
            body: jettonTransferPayload,
          })
        )
      )
      .endCell();

    const params = await this.tonApiClient.gasless.gaslessEstimate(
      Address.parse(this.paymasterToken.address),
      {
        walletAddress: wallet.address,
        walletPublicKey: publicKey.toString("hex"),
        messages: [
          {
            boc: messageToEstimate,
          },
        ],
      }
    );

    if (simulate) {
      return {
        hash: null,
        gasCost: Number(params.commission),
      }
    }

    const seqno = await contract.getSeqno();

    const jettonTransferForSend = wallet.createTransfer({
      seqno,
      authType: "internal",
      timeout: Math.ceil(Date.now() / 1000) + 5 * 60,
      secretKey: privateKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: params.messages.map((message) =>
        internal({
          to: message.address,
          value: BigInt(message.amount),
          body: message.payload,
        })
      ),
    });

    const extMessage = beginCell()
      .storeWritable(
        storeMessage(
          external({
            to: contract.address,
            init: seqno === 0 ? contract.init : undefined,
            body: jettonTransferForSend,
          })
        )
      )
      .endCell();

    await this.tonApiClient.gasless.gaslessSend({
      walletPublicKey: publicKey.toString("hex"),
      boc: extMessage
    });

    return {
      hash: null,
      gasCost: Number(params.commission)
    };
  }

   /**
   * Quotes a gasless jetton transfer to estimate costs
   * @param {Object} opts - Quote options
   * @param {Buffer} opts.publicKey - Public key buffer
   * @param {Buffer} opts.privateKey - Private key buffer
   * @param {string} opts.recipient - Recipient address
   * @param {BigInt} opts.amount - Amount to transfer
   * @param {string} opts.jettonMaster - Jetton master contract address
   * @returns {Promise<Object>} Quote result containing estimated costs and commission
   */
   async quoteSend(opts) {
    try {
      const result = await this.send({
        ...opts,
        simulate: true
      });

      return {
        ...result,
        success: true
      };
    } catch (error) {
      return {
        details: error.message,
        success: false
      };
    }
  }

  

  /**
   * Converts a TON address to its raw string format
   * @param {string} address - TON address in any format (user-friendly, base64, etc.)
   * @returns {string} Raw string representation of the address (non-bounceable, no checksum)
   */
  getRawAddress(address) {
    return Address.parse(address).toRawString();
  }

  /**
   * Converts a raw TON address to user-friendly format
   * @param {string} rawAddress - Raw TON address string
   * @returns {string} User-friendly address format (non-bounceable with checksum)
   */
  getUserAddress(rawAddress) {
    return Address.parse(rawAddress).toString({bounceable: false});
  }

  /**
   * Converts a base64 transaction address to hex format
   * @param {string} base64Address - The base64 encoded transaction address
   * @returns {string} The hex encoded transaction address
   */
  convertTransactionAddressToHex(base64Address) {
    const buffer = Buffer.from(base64Address, 'base64');
    return buffer.toString('hex');
  }
}

module.exports = { WDKAccountAbstractionTON };
