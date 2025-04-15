import type {BlockExplorer} from '../network/types';

export const blockExplorers: Record<string, BlockExplorer[]> = {
  arbitrum: [
    {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  ],
  'arbitrum-goerli': [
    {
      name: 'Arbiscan',
      url: 'https://goerli.arbiscan.io',
    },
  ],
  nova: [
    {
      name: 'BlockScout',
      url: 'https://nova-explorer.arbitrum.io',
    },
  ],
  astar: [
    {
      name: 'Astar Subscan',
      url: 'https://astar.subscan.io',
    },
  ],
  aurora: [
    {
      name: 'Aurorascan',
      url: 'https://aurorascan.dev',
    },
  ],
  'aurora-testnet': [
    {
      name: 'Aurorascan',
      url: 'https://testnet.aurorascan.dev',
    },
  ],
  avalanche: [
    {
      name: 'SnowTrace',
      url: 'https://snowtrace.io',
    },
  ],
  fuji: [
    {
      name: 'SnowTrace',
      url: 'https://testnet.snowtrace.io',
    },
  ],
  base: [
    {
      name: 'Basescan',
      url: 'https://basescan.org',
    },
  ],
  'base-goerli': [
    {
      name: 'Basescan',
      url: 'https://goerli.basescan.org',
    },
  ],
  bsc: [
    {
      name: 'BscScan',
      url: 'https://bscscan.com',
    },
  ],
  'bsc-testnet': [
    {
      name: 'BscScan',
      url: 'https://testnet.bscscan.com',
    },
  ],
  canto: [
    {
      name: 'Tuber.Build (Blockscout)',
      url: 'https://tuber.build',
    },
  ],
  celo: [
    {
      name: 'CeloScan',
      url: 'https://celoscan.io',
    },
  ],
  coredao: [
    {
      name: 'CoreDao',
      url: 'https://scan.coredao.org',
    },
  ],
  dfk: [
    {
      name: 'DFKSubnetScan',
      url: 'https://subnets.avax.network/defi-kingdoms',
    },
  ],
  fantom: [
    {
      name: 'FTMScan',
      url: 'https://ftmscan.com',
    },
  ],
  'fantom-testnet': [
    {
      name: 'FTMScan',
      url: 'https://testnet.ftmscan.com',
    },
  ],
  fuse: [
    {
      name: 'Fuse Explorer',
      url: 'https://explorer.fuse.io',
    },
  ],
  gnosis: [
    {
      name: 'Gnosis Chain Explorer',
      url: 'https://blockscout.com/xdai/mainnet',
    },
  ],
  chiado: [
    {
      name: 'Blockscout',
      url: 'https://blockscout.chiadochain.net',
    },
  ],
  goerli: [
    {
      name: 'Etherscan',
      url: 'https://goerli.etherscan.io',
    },
  ],
  harmony: [
    {
      name: 'Harmony Explorer',
      url: 'https://explorer.harmony.one',
    },
  ],
  kava: [
    {
      name: 'Kava EVM Explorer',
      url: 'https://kavascan.com',
    },
  ],
  'kava-testnet': [
    {
      name: 'Kava EVM Testnet Explorer',
      url: 'https://testnet.kavascan.com',
    },
  ],
  klaytn: [
    {
      name: 'KlaytnScope',
      url: 'https://scope.klaytn.com',
    },
  ],
  'klaytn-baobab': [
    {
      name: 'KlaytnScope',
      url: 'https://baobab.klaytnscope.com',
    },
  ],
  linea: [
    {
      name: 'Blockscout',
      url: 'https://explorer.linea.build',
    },
  ],
  ethereum: [
    {
      name: 'Etherscan',
      url: 'https://etherscan.io',
    },
  ],
  manta: [
    {
      name: 'Manta Explorer',
      url: 'https://pacific-explorer.manta.network',
    },
  ],
  'manta-testnet': [
    {
      name: 'Manta Testnet Explorer',
      url: 'https://pacific-explorer.testnet.manta.network',
    },
  ],
  mantle: [
    {
      name: 'Mantle Explorer',
      url: 'https://explorer.mantle.xyz',
    },
  ],
  'mantle-testnet': [
    {
      name: 'Mantle Testnet Explorer',
      url: 'https://explorer.testnet.mantle.xyz',
    },
  ],
  meter: [
    {
      name: 'MeterScan',
      url: 'https://scan.meter.io',
    },
  ],
  'meter-testnet': [
    {
      name: 'MeterTestnetScan',
      url: 'https://scan-warringstakes.meter.io',
    },
  ],
  metis: [
    {
      name: 'Andromeda Explorer',
      url: 'https://andromeda-explorer.metis.io',
    },
  ],
  'metis-goerli': [
    {
      name: 'Metis Goerli Explorer',
      url: 'https://goerli.explorer.metisdevops.link',
    },
  ],
  moonbeam: [
    {
      name: 'Moonscan',
      url: 'https://moonscan.io',
    },
  ],
  moonriver: [
    {
      name: 'Moonscan',
      url: 'https://moonriver.moonscan.io',
    },
  ],
  opbnb: [
    {
      name: 'opbnbscan',
      url: 'https://mainnet.opbnbscan.com',
    },
  ],
  'opbnb-testnet': [
    {
      name: 'opbnbscan',
      url: 'https://opbnbscan.com',
    },
  ],
  optimism: [
    {
      name: 'Optimism Explorer',
      url: 'https://explorer.optimism.io',
    },
  ],
  'optimism-goerli': [
    {
      name: 'Etherscan',
      url: 'https://goerli-optimism.etherscan.io',
    },
  ],
  pgn: [
    {
      name: 'PGN Explorer',
      url: 'https://explorer.publicgoods.network',
    },
  ],
  'pgn-testnet': [
    {
      name: 'PGN Testnet Explorer',
      url: 'https://explorer.sepolia.publicgoods.network',
    },
  ],
  polygon: [
    {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
    },
  ],
  mumbai: [
    {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com',
    },
  ],
  zkevm: [
    {
      name: 'PolygonScan',
      url: 'https://zkevm.polygonscan.com',
    },
  ],
  'zkevm-testnet': [
    {
      name: 'PolygonScan',
      url: 'https://testnet-zkevm.polygonscan.com',
    },
  ],
  scroll: [
    {
      name: 'Blockscout',
      url: 'https://blockscout.scroll.io',
    },
  ],
  'scroll-sepolia': [
    {
      name: 'Blockscout',
      url: 'https://sepolia-blockscout.scroll.io',
    },
  ],
  sepolia: [
    {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  ],
  shimmer: [
    {
      name: 'Shimmer Network Explorer',
      url: 'https://explorer.evm.shimmer.network',
    },
  ],
  'shimmer-testnet': [
    {
      name: 'Shimmer Network Explorer',
      url: 'https://explorer.evm.testnet.shimmer.network',
    },
  ],
  telos: [
    {
      name: 'Teloscan',
      url: 'https://www.teloscan.io',
    },
  ],
  'telos-testnet': [
    {
      name: 'Teloscan (testnet)',
      url: 'https://testnet.teloscan.io',
    },
  ],
  tenet: [
    {
      name: 'TenetScan Mainnet',
      url: 'https://tenetscan.io',
    },
  ],
  zksync: [
    {
      name: 'zkExplorer',
      url: 'https://explorer.zksync.io',
    },
  ],
  'zksync-testnet': [
    {
      name: 'zkExplorer',
      url: 'https://goerli.explorer.zksync.io',
    },
  ],
  zora: [
    {
      name: 'Explorer',
      url: 'https://explorer.zora.energy',
    },
  ],
  'zora-testnet': [
    {
      name: 'Explorer',
      url: 'https://testnet.explorer.zora.energy',
    },
  ],
};
