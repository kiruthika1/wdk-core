/**
 * @fileoverview Bridge capabilities for TON
 * @module WDKAccountAbstractionTON
 */
const { Buffer } = require('buffer');
const { Address, beginCell, storeMessageRelaxed, toNano } = require('@ton/core');
const { WalletContractV5R1, internal, Cell } = require('@ton/ton');
const { CurrencyAmount, Token } = require('@wdk-account-abstraction-ton/ui-core');
const { parseTonAddress } = require('@wdk-account-abstraction-ton/ui-ton');
const { createOftBridgeConfig } = require('@wdk-account-abstraction-ton/ui-bridge-oft');
const { OftBridgeApiFactory__ton } = require('@wdk-account-abstraction-ton/ui-bridge-oft/ton');
const { replace } = require('lodash-es');

const MAXIMUM_BRIDGE_FEE = toNano(0.4604);
const BRIDGING_FEE = 0.01;

const BRIDGE_ADDRESS_CONFIG = {
  oftProxy: '0x170725394aa56136fbd27d0ce31d8a98e0f8ae72a4d2379b5dde83e211a2d5fa',
  controller: '0x1eb2bbea3d8c0d42ff7fd60f0264c866c934bbff727526ca759e7374cae0c166',
  ulnManager: '0x150645746e25be5486eb3b2f5d98b44c6b324697c48d495d059f96fc9d3ec368',
  token: '0xb113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe',
  executor: ''
};

const BRIDGE_ULN_CONFIGS = [
  {
    confirmations: '5',
    confirmationsNull: false,
    executor: '0x0',
    executorNull: true,
    maxMessageBytes: '42',
    optionalDVNs: [],
    optionalDVNsNull: false,
    requiredDVNs: [
      '0xd122dec4ec8bd66c68344faf0dd471d727a7d57a21b62051705bbe2e4c272a7'
    ],
    requiredDVNsNull: false,
    workerQuoteGasLimit: '120000'
  }
];

const USDT_ADDRESS_CONFIG = {
  arbitrum: {
    oftProxy: '0x14e4a1b13bf7f943c8ff7c51fb60fa964a298d92',
    oftNative: '0x238A52455a1EF6C987CaC94b28B4081aFE50ba06',
    token: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    executor: '0x31CAe3B7fB82d847621859fb1585353c5720660D'
  },
  ethereum: {
    oftProxy: '0x6c96de32cea08842dcc4058c14d3aaad7fa41dee',
    oftNative: '0x811ed79dB9D34E83BDB73DF6c3e07961Cfb0D5c0',
    token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    executor: '0x173272739Bd7Aa6e4e214714048a9fE699453059'
  },
  ton: {
    oftProxy: '0x170725394aa56136fbd27d0ce31d8a98e0f8ae72a4d2379b5dde83e211a2d5fa',
    controller: '0x1eb2bbea3d8c0d42ff7fd60f0264c866c934bbff727526ca759e7374cae0c166',
    ulnManager: '0x150645746e25be5486eb3b2f5d98b44c6b324697c48d495d059f96fc9d3ec368',
    token: '0xb113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe',
    executor: ''
  },
  tron: {
    oftProxy: '0x8925c1dD3e5d8011946a3430d91Be742bA8EE930',
    token: '0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C',
    executor: '0x67DE40af19C0C0a6D0278d96911889fAF4EBc1Bc'
  }
};

const USDT = createOftBridgeConfig({
  version: 3,
  fee: false,
  sharedDecimals: 6,
  deployments: {
    arbitrum: {
      eid: 30110,
      oftProxy: {
        address: USDT_ADDRESS_CONFIG.arbitrum.oftProxy
      },
      oftNative: {
        address: USDT_ADDRESS_CONFIG.arbitrum.oftNative
      },
      token: {
        chainKey: 'arbitrum',
        decimals: 6,
        symbol: 'USDT0',
        name: 'USDT0',
        address: USDT_ADDRESS_CONFIG.arbitrum.token
      }
    },
    ethereum: {
      eid: 30101,
      oftProxy: {
        address: USDT_ADDRESS_CONFIG.ethereum.oftProxy
      },
      oftNative: {
        address: USDT_ADDRESS_CONFIG.ethereum.oftNative
      },
      token: {
        chainKey: 'ethereum',
        decimals: 6,
        symbol: 'USDT',
        name: 'USDT',
        address: USDT_ADDRESS_CONFIG.ethereum.token
      }
    },
    ton: {
      eid: 30343,
      oftProxy: {
        address: USDT_ADDRESS_CONFIG.ton.oftProxy
      },
      token: {
        chainKey: 'ton',
        decimals: 6,
        symbol: 'USDT',
        name: 'USDT',
        address: USDT_ADDRESS_CONFIG.ton.token
      },
      destinationChains: [
        'ethereum',
        'arbitrum',
        'tron'
      ]
    },
    tron: {
      eid: 30420,
      oftProxy: {
        address: USDT_ADDRESS_CONFIG.tron.oftProxy
      },
      token: {
        chainKey: 'tron',
        decimals: 6,
        symbol: 'USDT',
        name: 'USDT',
        address: USDT_ADDRESS_CONFIG.tron.token
      },
      destinationChains: [
        'ton',
        'ethereum',
        'arbitrum'
      ]
    }
  }
});

/**
 * Bridge class for handling cross-chain token transfers
 * @class
 */
class BridgeOperations {
  /**
   * Creates a new Bridge instance
   * @param {Object} client - The TON client instance
   * @param {Object} accountAbstraction - The WDKAccountAbstractionTON instance
   */
  constructor(client, accountAbstraction) {
    this._client = client;
    this._accountAbstraction = accountAbstraction;
    this._bridgeHelper = new OftBridgeApiFactory__ton(
      this._client,
      BRIDGE_ADDRESS_CONFIG,
      BRIDGE_ULN_CONFIGS
    ).create(USDT);
  }

  /**
   * Initiates a cross-chain token transfer
   * @param {Object} opts - Bridge operation options
   * @param {string} opts.address - Source address
   * @param {string} opts.recipient - Recipient address
   * @param {string} opts.targetChain - Target chain ('ethereum', 'arbitrum', or 'tron')
   * @param {string} opts.nativeTokenDropAmount - Amount of native token to drop on destination chain
   * @param {boolean} [opts.simulate] - Whether to simulate the transaction
   * @param {Buffer} opts.publicKey - Public key buffer
   * @param {Buffer} opts.privateKey - Private key buffer
   * @param {BigInt} opts.amount - Amount to transfer
   * @returns {Promise<Object>} Transaction result containing hash, gas cost, and bridging cost
   * @throws {Error} If chain is unsupported or insufficient balance
   */
  async bridge(opts) {
    const { address, recipient, targetChain, nativeTokenDropAmount, simulate, publicKey, privateKey } = opts;

    if (!['ethereum', 'arbitrum', 'tron'].includes(targetChain)) {
      throw new Error('Unsupported chain.');
    }

    const amount = opts.amount;

    const jettonAddress = Address.parse(this._accountAbstraction.paymasterToken.address);

    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: publicKey
    });

    const balance = await this._accountAbstraction.getJettonBalance(jettonAddress, wallet.address);

    if (balance < amount) {
      throw new Error('Not enough jetton balance.');
    }

    const jettonWalletAddress = await this._accountAbstraction.getJettonWalletAddress(
      { publicKey: publicKey, secretKey: privateKey },
      jettonAddress
    );

    const body = await this._getBridgeBody({
      dstChainKey: targetChain,
      srcAddress: address,
      srcAmount: CurrencyAmount.fromRawAmount(
        Token.from({ decimals: 6, chainKey: 'ton' }),
        amount
      ),
      dstAddress: this._parseAddressToHex(recipient),
      dstAmountMin: CurrencyAmount.fromRawAmount(
        Token.from({ decimals: 6, chainKey: targetChain }),
        1
      ),
      fee: {
        nativeFee: CurrencyAmount.fromRawAmount(
          Token.from({ decimals: 9, chainKey: 'ton' }),
          100_000_000
        )
      },
      dstNativeAmount: BigInt(nativeTokenDropAmount ? nativeTokenDropAmount : 0)
    });

    const message = beginCell()
      .storeWritable(
        storeMessageRelaxed(
          internal({
            to: jettonWalletAddress,
            value: MAXIMUM_BRIDGE_FEE,
            body: body
          })
        )
      )
      .endCell();

    const { commission } = await this._accountAbstraction.sendGaslessTransaction(
      { publicKey: publicKey, secretKey: privateKey }, message, jettonAddress, { simulate }
    );

    return {
      hash: null,
      gasCost: commission,
      bridgeCost: amount * BRIDGING_FEE
    };
  }

  /**
   * Quotes a bridge operation to estimate costs
   * @param {Object} opts - Bridge operation options
   * @param {string} opts.address - Source address
   * @param {string} opts.recipient - Recipient address
   * @param {string} opts.targetChain - Target chain ('ethereum', 'arbitrum', or 'tron')
   * @param {string} opts.nativeTokenDropAmount - Amount of native token to drop on destination chain
   * @param {Buffer} opts.publicKey - Public key buffer
   * @param {Buffer} opts.privateKey - Private key buffer
   * @param {BigInt} opts.amount - Amount to transfer
   * @returns {Promise<Object>} Quote result containing success status and details
   */
  async quoteBridge(opts) {
    try {
      const result = await this.bridge({
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
   * Gets the bridge message body for the transfer
   * @private
   * @param {Object} input - Bridge input parameters
   * @returns {Promise<Cell>} The bridge message body as a Cell
   */
  async _getBridgeBody(input) {
    const { dstAmount } = await this._bridgeHelper.getOutput(input);

    input.dstAmountMin = dstAmount;

    const transfer = await this._bridgeHelper.transfer(input);
    const data = await transfer.unwrap();

    const boc = data.messages[0].payload.toBoc()

    return Cell.fromBoc(boc)[0];
  }

  /**
   * Parses a TON address to hex format
   * @private
   * @param {string} address - TON address to parse
   * @returns {string} Hex-formatted address
   */
  _parseAddressToHex(address) {
    return replace(parseTonAddress(address).toRawString(), ':', 'x');
  }
}

module.exports = { BridgeOperations };
