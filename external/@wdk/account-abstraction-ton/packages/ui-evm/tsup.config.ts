import {defineConfig, getDefaultConfig} from '@wdk-account-abstraction-ton/tsup-config';

export default defineConfig({
  ...getDefaultConfig(),
  splitting: true,
  entry: {
    index: 'src/index.ts',
    anvil: 'src/anvil.ts',
    tenderly: 'src/tenderly.ts',
    typechain: 'src/typechain/index.ts',
  },
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
    };
    return options;
  },
});
