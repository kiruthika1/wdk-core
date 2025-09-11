import { test } from 'brittle'
import WdkManager from '../src/wdk-manager.js'
import WalletManager from '@wdk/wallet'
// Mock wallet class for testing
class MockWallet extends WalletManager {
//   constructor (seed, config) {
//     super(seed, config)
//   }

  async getAccount (index) {
    return { address: `mock-address-${index}`, index }
  }

  async getAccountByPath (path) {
    return { address: `mock-address-path-${path}`, path }
  }

  async getFeeRates () {
    return { normal: 1, fast: 2 }
  }

  async dispose () {
    // Mock dispose
  }
}

// Constructor tests
test('constructor -                         ', async (t) => {
  const validSeed = 'test only example nut use this real life secret phrase must random'
  const wdk = new WdkManager(validSeed)

  t.ok(wdk instanceof WdkManager, 'should be instance of WdkManager')
  t.is(wdk._seed, validSeed, 'should store the seed phrase')
  t.ok(wdk._wallets instanceof Map, 'should initialize wallets map')
  t.is(wdk._wallets.size, 0, 'should start with empty wallets map')
})

test('constructor - should initialize with Uint8Array seed', async (t) => {
  const seedBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
  const wdk = new WdkManager(seedBytes)

  t.ok(wdk instanceof WdkManager, 'should be instance of WdkManager')
  t.is(wdk._seed, seedBytes, 'should store the seed bytes')
  t.ok(wdk._wallets instanceof Map, 'should initialize wallets map')
})

test('constructor - should throw error with invalid seed', async (t) => {
  try {
    const _wdk = new WdkManager('invalid seed phrase')
    _wdk.dispose()
    t.fail('should have thrown error')
  } catch (error) {
    t.pass('should throw error for invalid seed phrase')
  }
})

test('constructor - should throw error with missing seed', async (t) => {
  try {
    const _wdk = new WdkManager()
    _wdk.dispose()
    t.fail('should have thrown error')
  } catch (error) {
    t.pass('should throw error for missing seed')
  }
})

test('constructor - should throw error with null seed', async (t) => {
  try {
    const _wdk = new WdkManager(null)
    _wdk.dispose()
    t.fail('should have thrown error')
  } catch (error) {
    t.pass('should throw error for null seed')
  }
})

// Static methods tests
test('getRandomSeedPhrase - should return a valid seed phrase', async (t) => {
  const seed = WdkManager.getRandomSeedPhrase()

  t.is(typeof seed, 'string', 'should return a string')
  t.ok(seed.length > 0, 'should return non-empty string')
  t.ok(WdkManager.isValidSeed(seed), 'should return valid seed phrase')
})

test('getRandomSeedPhrase - should return different seeds on multiple calls', async (t) => {
  const seed1 = WdkManager.getRandomSeedPhrase()
  const seed2 = WdkManager.getRandomSeedPhrase()

  t.not(seed1, seed2, 'should return different seeds')
  t.ok(WdkManager.isValidSeed(seed1), 'first seed should be valid')
  t.ok(WdkManager.isValidSeed(seed2), 'second seed should be valid')
})

test('isValidSeedPhrase - should return true for valid seed phrase', async (t) => {
  const validSeed = 'test only example nut use this real life secret phrase must random'
  const isValid = WdkManager.isValidSeed(validSeed)

  t.is(isValid, true, 'should return true for valid seed phrase')
})

test('isValidSeedPhrase - should return false for invalid seed phrase', async (t) => {
  const invalidSeed = 'invalid seed phrase that is not valid'
  const isValid = WdkManager.isValidSeed(invalidSeed)

  t.is(isValid, false, 'should return false for invalid seed phrase')
})

test('isValidSeedPhrase - should return false for empty string', async (t) => {
  const isValid = WdkManager.isValidSeed('')

  t.is(isValid, false, 'should return false for empty string')
})

test('isValidSeedPhrase - should return false for non-string input', async (t) => {
  const isValid = WdkManager.isValidSeed(null)

  t.is(isValid, false, 'should return false for null input')
})

// registerWallet tests
test('registerWallet - should register wallet successfully', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  const config = { rpcUrl: 'https://test.com' }

  const result = wdk.registerWallet('ethereum', MockWallet, config)
  t.is(result, wdk, 'should return this for method chaining')
  t.ok(wdk._wallets.has('ethereum'), 'should store wallet in map')
  t.ok(wdk._wallets.get('ethereum') instanceof MockWallet, 'should create wallet instance')
  t.is(wdk._wallets.get('ethereum')._config, config, 'should pass config to wallet')
})

test('registerWallet - should support method chaining', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  const result = wdk
    .registerWallet('ethereum', MockWallet, { rpcUrl: 'https://eth.com' })
    .registerWallet('bitcoin', MockWallet, { network: 'testnet' })

  t.is(result, wdk, 'should return this instance')
  t.ok(wdk._wallets.has('ethereum'), 'should register ethereum wallet')
  t.ok(wdk._wallets.has('bitcoin'), 'should register bitcoin wallet')
  t.is(wdk._wallets.size, 2, 'should have two wallets registered')
})

test('registerWallet - should throw error for non-string blockchain', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  try {
    wdk.registerWallet(123, MockWallet, {})
    t.fail('should have thrown error')
  } catch (error) {
    t.pass('should throw error for non-string blockchain')
  }
})

test('registerWallet - should throw error for non-function wallet', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  try {
    wdk.registerWallet('ethereum', 'not-a-function', {})
    t.fail('should have thrown error')
  } catch (error) {
    t.pass('should throw error for non-function wallet')
  }
})

test('registerWallet - should throw error for null wallet', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  try {
    wdk.registerWallet('ethereum', null, {})
    t.fail('should have thrown error')
  } catch (error) {
    t.pass('should throw error for null wallet')
  }
})

test('registerWallet - should overwrite existing wallet', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  const config1 = { rpcUrl: 'https://first.com' }
  const config2 = { rpcUrl: 'https://second.com' }

  wdk.registerWallet('ethereum', MockWallet, config1)
  wdk.registerWallet('ethereum', MockWallet, config2)

  t.is(wdk._wallets.size, 1, 'should have only one wallet')
  t.is(wdk._wallets.get('ethereum')._config, config2, 'should use second config')
})

// getAccount tests
test('getAccount - should return account for registered blockchain', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

  const account = await wdk.getAccount('ethereum', 0)

  t.ok(account, 'should return account')
  t.is(account.address, 'mock-address-0', 'should return correct address')
  t.is(account.index, 0, 'should return correct index')
})

test('getAccount - should use default index 0', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

  const account = await wdk.getAccount('ethereum')

  t.ok(account, 'should return account')
  t.is(account.index, 0, 'should use default index 0')
})

test('getAccount - should return different accounts for different indices', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

  const account1 = await wdk.getAccount('ethereum', 0)
  const account2 = await wdk.getAccount('ethereum', 1)

  t.not(account1.address, account2.address, 'should return different addresses')
  t.is(account1.index, 0, 'should return correct index for first account')
  t.is(account2.index, 1, 'should return correct index for second account')
})

test('getAccount - should throw error for unregistered blockchain', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getAccount('unregistered', 0)
  }, 'should throw error for unregistered blockchain')
})

test('getAccount - should throw error for empty blockchain name', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getAccount('', 0)
  }, 'should throw error for empty blockchain name')
})

test('getAccount - should throw error for null blockchain name', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getAccount(null, 0)
  }, 'should throw error for null blockchain name')
})

// getAccountByPath tests
test('getAccountByPath - should return account for registered blockchain', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

  const account = await wdk.getAccountByPath('ethereum', 'm/44\'/60\'/0\'/0/0')

  t.ok(account, 'should return account')
  t.is(account.address, 'mock-address-path-m/44\'/60\'/0\'/0/0', 'should return correct address')
  t.is(account.path, 'm/44\'/60\'/0\'/0/0', 'should return correct path')
})

test('getAccountByPath - should return different accounts for different paths', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

  const account1 = await wdk.getAccountByPath('ethereum', 'm/44\'/60\'/0\'/0/0')
  const account2 = await wdk.getAccountByPath('ethereum', 'm/44\'/60\'/0\'/0/1')

  t.not(account1.address, account2.address, 'should return different addresses')
  t.not(account1.path, account2.path, 'should return different paths')
})

test('getAccountByPath - should throw error for unregistered blockchain', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getAccountByPath('unregistered', 'm/44\'/60\'/0\'/0/0')
  }, 'should throw error for unregistered blockchain')
})

test('getAccountByPath - should throw error for empty blockchain name', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getAccountByPath('', 'm/44\'/60\'/0\'/0/0')
  }, 'should throw error for empty blockchain name')
})

test('getAccountByPath - should throw error for null blockchain name', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getAccountByPath(null, 'm/44\'/60\'/0\'/0/0')
  }, 'should throw error for null blockchain name')
})

// getFeeRates tests
test('getFeeRates - should return fee rates for registered blockchain', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

  const feeRates = await wdk.getFeeRates('ethereum')

  t.ok(feeRates, 'should return fee rates')
  t.is(feeRates.normal, 1, 'should return correct normal fee rate')
  t.is(feeRates.fast, 2, 'should return correct fast fee rate')
})

test('getFeeRates - should throw error for unregistered blockchain', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getFeeRates('unregistered')
  }, 'should throw error for unregistered blockchain')
})

test('getFeeRates - should throw error for empty blockchain name', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getFeeRates('')
  }, 'should throw error for empty blockchain name')
})

test('getFeeRates - should throw error for null blockchain name', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  await t.exception(async () => {
    await wdk.getFeeRates(null)
  }, 'should throw error for null blockchain name')
})

// dispose tests
test('dispose - should dispose all registered wallets', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  // Create a mock wallet with dispose method
  class DisposableMockWallet extends MockWallet {
    constructor (seed, config) {
      super(seed, config)
      this.disposed = false
    }

    async dispose () {
      this.disposed = true
    }
  }

  wdk.registerWallet('ethereum', DisposableMockWallet, { rpcUrl: 'https://test.com' })
  wdk.registerWallet('bitcoin', DisposableMockWallet, { network: 'testnet' })

  await wdk.dispose()

  // Check that both wallets were disposed
  const ethereumWallet = wdk._wallets.get('ethereum')
  const bitcoinWallet = wdk._wallets.get('bitcoin')

  t.ok(ethereumWallet.disposed, 'should dispose ethereum wallet')
  t.ok(bitcoinWallet.disposed, 'should dispose bitcoin wallet')
})

test('dispose - should handle wallets without dispose method', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
  wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

  // Should not throw error
  await wdk.dispose()

  t.pass('should handle wallets without dispose method gracefully')
})

test('dispose - should work with empty wallet map', async (t) => {
  const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

  // Should not throw error
  await wdk.dispose()

  t.pass('should work with empty wallet map')
})
