import {defineConfig, getDefaultConfig} from '@wdk-account-abstraction-ton/tsup-config';

export default defineConfig({
  ...getDefaultConfig(),
  entry: ['src/index.ts'],
});
