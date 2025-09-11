import { describe, expect, test } from '@jest/globals'
import WdkManager, { WalletManager } from '../src/wdk-manager-new.js'

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
describe('Constructor', () => {
  test('should initialize with valid seed phrase', async () => {
    const validSeed = 'test only example nut use this real life secret phrase must random'
    const wdk = new WdkManager(validSeed)

    expect(wdk).toBeInstanceOf(WdkManager)
    expect(wdk._seed).toBe(validSeed)
    expect(wdk._wallets).toBeInstanceOf(Map)
    expect(wdk._wallets.size).toBe(0)
  })

  test('should initialize with Uint8Array seed', async () => {
    const seedBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const wdk = new WdkManager(seedBytes)

    expect(wdk).toBeInstanceOf(WdkManager)
    expect(wdk._seed).toBe(seedBytes)
    expect(wdk._wallets).toBeInstanceOf(Map)
  })

  test('should throw error with invalid seed', async () => {
    expect(() => {
      const wdk = new WdkManager('invalid seed phrase')
      wdk.dispose()
    }).toThrow()
  })

  test('should throw error with missing seed', async () => {
    expect(() => {
      const wdk = new WdkManager()
      wdk.dispose()
    }).toThrow()
  })

  test('should throw error with null seed', async () => {
    expect(() => {
      const wdk = new WdkManager(null)
      wdk.dispose()
    }).toThrow()
  })
})

// Static methods tests
describe('Static Methods', () => {
  test('getRandomSeedPhrase should return a valid seed phrase', async () => {
    const seed = WdkManager.getRandomSeedPhrase()

    expect(typeof seed).toBe('string')
    expect(seed.length).toBeGreaterThan(0)
    expect(WdkManager.isValidSeed(seed)).toBe(true)
  })

  test('getRandomSeedPhrase should return different seeds on multiple calls', async () => {
    const seed1 = WdkManager.getRandomSeedPhrase()
    const seed2 = WdkManager.getRandomSeedPhrase()

    expect(seed1).not.toBe(seed2)
    expect(WdkManager.isValidSeed(seed1)).toBe(true)
    expect(WdkManager.isValidSeed(seed2)).toBe(true)
  })

  test('isValidSeedPhrase should return true for valid seed phrase', async () => {
    const validSeed = 'test only example nut use this real life secret phrase must random'
    const isValid = WdkManager.isValidSeed(validSeed)

    expect(isValid).toBe(true)
  })

  test('isValidSeedPhrase should return false for invalid seed phrase', async () => {
    const invalidSeed = 'invalid seed phrase that is not valid'
    const isValid = WdkManager.isValidSeed(invalidSeed)

    expect(isValid).toBe(false)
  })

  test('isValidSeedPhrase should return false for empty string', async () => {
    const isValid = WdkManager.isValidSeed('')

    expect(isValid).toBe(false)
  })

  test('isValidSeedPhrase should return false for non-string input', async () => {
    const isValid = WdkManager.isValidSeed(null)

    expect(isValid).toBe(false)
  })
})

// registerWallet tests
describe('registerWallet', () => {
  test('should register wallet successfully', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    const config = { rpcUrl: 'https://test.com' }

    const result = wdk.registerWallet('ethereum', MockWallet, config)
    expect(result).toBe(wdk)
    expect(wdk._wallets.has('ethereum')).toBe(true)
    expect(wdk._wallets.get('ethereum')).toBeInstanceOf(MockWallet)
    expect(wdk._wallets.get('ethereum')._config).toBe(config)
  })

  test('should support method chaining', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    const result = wdk
      .registerWallet('ethereum', MockWallet, { rpcUrl: 'https://eth.com' })
      .registerWallet('bitcoin', MockWallet, { network: 'testnet' })

    expect(result).toBe(wdk)
    expect(wdk._wallets.has('ethereum')).toBe(true)
    expect(wdk._wallets.has('bitcoin')).toBe(true)
    expect(wdk._wallets.size).toBe(2)
  })

  test('should throw error for non-string blockchain', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    expect(() => {
      wdk.registerWallet(123, MockWallet, {})
    }).toThrow()
  })

  test('should throw error for non-function wallet', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    expect(() => {
      wdk.registerWallet('ethereum', 'not-a-function', {})
    }).toThrow()
  })

  test('should throw error for null wallet', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    expect(() => {
      wdk.registerWallet('ethereum', null, {})
    }).toThrow()
  })

  test('should overwrite existing wallet', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    const config1 = { rpcUrl: 'https://first.com' }
    const config2 = { rpcUrl: 'https://second.com' }

    wdk.registerWallet('ethereum', MockWallet, config1)
    wdk.registerWallet('ethereum', MockWallet, config2)

    expect(wdk._wallets.size).toBe(1)
    expect(wdk._wallets.get('ethereum')._config).toBe(config2)
  })
})

// getAccount tests
describe('getAccount', () => {
  test('should return account for registered blockchain', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

    const account = await wdk.getAccount('ethereum', 0)

    expect(account).toBeTruthy()
    expect(account.address).toBe('mock-address-0')
    expect(account.index).toBe(0)
  })

  test('should use default index 0', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

    const account = await wdk.getAccount('ethereum')

    expect(account).toBeTruthy()
    expect(account.index).toBe(0)
  })

  test('should return different accounts for different indices', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

    const account1 = await wdk.getAccount('ethereum', 0)
    const account2 = await wdk.getAccount('ethereum', 1)

    expect(account1.address).not.toBe(account2.address)
    expect(account1.index).toBe(0)
    expect(account2.index).toBe(1)
  })

  test('should throw error for unregistered blockchain', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getAccount('unregistered', 0)).rejects.toThrow()
  })

  test('should throw error for empty blockchain name', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getAccount('', 0)).rejects.toThrow()
  })

  test('should throw error for null blockchain name', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getAccount(null, 0)).rejects.toThrow()
  })
})

// getAccountByPath tests
describe('getAccountByPath', () => {
  test('should return account for registered blockchain', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

    const account = await wdk.getAccountByPath('ethereum', 'm/44\'/60\'/0\'/0/0')

    expect(account).toBeTruthy()
    expect(account.address).toBe('mock-address-path-m/44\'/60\'/0\'/0/0')
    expect(account.path).toBe('m/44\'/60\'/0\'/0/0')
  })

  test('should return different accounts for different paths', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

    const account1 = await wdk.getAccountByPath('ethereum', 'm/44\'/60\'/0\'/0/0')
    const account2 = await wdk.getAccountByPath('ethereum', 'm/44\'/60\'/0\'/0/1')

    expect(account1.address).not.toBe(account2.address)
    expect(account1.path).not.toBe(account2.path)
  })

  test('should throw error for unregistered blockchain', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getAccountByPath('unregistered', 'm/44\'/60\'/0\'/0/0')).rejects.toThrow()
  })

  test('should throw error for empty blockchain name', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getAccountByPath('', 'm/44\'/60\'/0\'/0/0')).rejects.toThrow()
  })

  test('should throw error for null blockchain name', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getAccountByPath(null, 'm/44\'/60\'/0\'/0/0')).rejects.toThrow()
  })
})

// getFeeRates tests
describe('getFeeRates', () => {
  test('should return fee rates for registered blockchain', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

    const feeRates = await wdk.getFeeRates('ethereum')

    expect(feeRates).toBeTruthy()
    expect(feeRates.normal).toBe(1)
    expect(feeRates.fast).toBe(2)
  })

  test('should throw error for unregistered blockchain', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getFeeRates('unregistered')).rejects.toThrow()
  })

  test('should throw error for empty blockchain name', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getFeeRates('')).rejects.toThrow()
  })

  test('should throw error for null blockchain name', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    await expect(wdk.getFeeRates(null)).rejects.toThrow()
  })
})

// dispose tests
describe('dispose', () => {
  test('should dispose all registered wallets', async () => {
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

    expect(ethereumWallet.disposed).toBe(true)
    expect(bitcoinWallet.disposed).toBe(true)
  })

  test('should handle wallets without dispose method', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')
    wdk.registerWallet('ethereum', MockWallet, { rpcUrl: 'https://test.com' })

    // Should not throw error
    await expect(wdk.dispose()).resolves.not.toThrow()
  })

  test('should work with empty wallet map', async () => {
    const wdk = new WdkManager('test only example nut use this real life secret phrase must random')

    // Should not throw error
    await expect(wdk.dispose()).resolves.not.toThrow()
  })
})
