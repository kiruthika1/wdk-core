import type {Rpc} from './types';

export const rpcs: {[chainKey in string]: Rpc[]} = {
  solana: [
    {
      url: 'https://api.mainnet-beta.solana.com',
    },
  ],
  'solana-testnet': [
    {
      url: 'https://api.devnet.solana.com',
    },
  ],
  ethereum: [
    {
      url: 'https://eth.drpc.org',
      weight: 1000000,
    },
    {
      url: 'https://eth-pokt.nodies.app',
      weight: 0,
    },
    {
      url: 'https://ethereum.publicnode.com',
      weight: 1000000,
    },
    {
      url: 'https://eth-mainnet.public.blastapi.io',
      weight: 1000000,
    },
    {
      url: 'https://cloudflare-eth.com',
      weight: 1000,
    },
    {
      url: 'https://mainnet.infura.io/v3/${INFURA_API_KEY}',
      weight: 1,
    },
    {
      url: 'https://eth-mainnet.alchemyapi.io/v2/84tGz8xVIWFkagsaSzNjObh7aSPbxeXD',
      weight: 100,
    },
    {
      url: 'https://eth-mainnet.alchemyapi.io/v2/VsPzIezK0AtqsnrWAuV0Gew-MS7H_E5E',
      weight: 100,
    },
    {
      url: 'https://eth.llamarpc.com/rpc/${LLAMANODES_API_KEY}',
      weight: 10000,
    },
    {
      url: 'https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}',
      weight: 100,
    },
  ],
  ink: [
    {
      url: 'https://rpc-gel.inkonchain.com',
    },
    {
      url: 'https://rpc-qnd.inkonchain.com',
    },
  ],
  bera: [
    {
      url: 'https://rpc.berachain.com',
    },
  ],
  rinkeby: [
    {
      url: 'https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}',
    },
  ],
  goerli: [
    {
      url: 'https://goerli.infura.io/v3/${INFURA_API_KEY}',
    },
    {
      url: 'wss://goerli.infura.io/v3/${INFURA_API_KEY}',
    },
    {
      url: 'https://ethereum-goerli.publicnode.com',
    },
    {
      url: 'https://eth-goerli.public.blastapi.io',
    },
    {
      url: 'https://rpc.ankr.com/eth_goerli',
    },
    {
      url: 'https://rpc.goerli.eth.gateway.fm',
    },
  ],
  bsc: [
    {
      url: 'https://bsc.drpc.org',
    },
    {
      url: 'https://bscrpc.com',
    },
    {
      url: 'https://binance.nodereal.io',
    },
    {
      url: 'https://bsc-dataseed.binance.org',
    },
    {
      url: 'https://bsc-dataseed1.binance.org',
    },
    {
      url: 'https://bsc-dataseed2.binance.org',
    },
    {
      url: 'https://bsc-dataseed3.binance.org',
    },
    {
      url: 'https://bsc-dataseed4.binance.org',
    },
    {
      url: 'https://bsc-pokt.nodies.app',
      weight: 0,
    },
  ],
  'bsc-testnet': [
    {
      url: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    },
    {
      url: 'https://data-seed-prebsc-2-s2.binance.org:8545',
    },
    {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    },
    {
      url: 'https://data-seed-prebsc-1-s2.binance.org:8545',
    },
    {
      url: 'https://data-seed-prebsc-2-s1.binance.org:8545',
    },
  ],
  polygon: [
    {
      url: 'https://polygon.drpc.org',
      weight: 1000000,
    },
    {
      url: 'https://polygon-pokt.nodies.app',
      weight: 0,
    },
    {
      url: 'https://matic-mainnet.chainstacklabs.com',
      weight: 1000000,
    },
    {
      url: 'https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}',
    },
    {
      url: 'https://polygon-rpc.com',
      weight: 1000000,
    },
    {
      url: 'https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
      weight: 1,
    },
    {
      url: 'https://polygon-mainnet.g.alchemy.com/v2/me6Q04fTd2kTT74BUYAp82d_3KL-ObCw',
      weight: 100,
    },
    {
      url: 'https://polygon-mainnet.g.alchemy.com/v2/q3f-QpPeM_g7rL3G21Cr9tFeuYAquyYl',
      weight: 100,
    },
    {
      url: 'https://polygon.llamarpc.com/rpc/${LLAMANODES_API_KEY}',
      weight: 1000,
    },
    {
      url: 'https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
      weight: 100,
    },
  ],
  mumbai: [
    {
      url: 'https://matic-mumbai.chainstacklabs.com',
    },
    {
      url: 'https://rpc-mumbai.maticvigil.com/v1/${MATICVIGIL_API_KEY}',
    },
    {
      url: 'https://api.zan.top/node/v1/polygon/mumbai/public',
    },
    {
      url: 'https://gateway.tenderly.co/public/polygon-mumbai',
      weight: 0,
    },
    {
      url: 'https://polygon-mumbai.gateway.tenderly.co',
      weight: 0,
    },
    {
      url: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    },
    {
      url: 'https://polygon-mumbai-bor.publicnode.com',
    },
    {
      url: 'https://polygon-testnet.public.blastapi.io',
    },
    {
      url: 'https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    },
    {
      url: 'https://endpoints.omniatech.io/v1/matic/mumbai/public',
    },
    {
      url: 'https://rpc-mumbai.maticvigil.com',
    },
    {
      url: 'https://rpc.ankr.com/polygon_mumbai',
    },
    {
      url: 'https://polygon-mumbai-pokt.nodies.app',
      weight: 0,
    },
  ],
  avalanche: [
    {
      url: 'https://avalanche.drpc.org',
      weight: 1000000,
    },
    {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      weight: 1000000,
    },
    {
      url: 'https://avalanche--mainnet--rpc.datahub.figment.io/apikey/b1a0d59ba8a5d08049bbfdc174dca1b1/ext/bc/C/rpc',
      weight: 100,
    },
    {
      url: 'https://avax-pokt.nodies.app/ext/bc/C/rpc',
      weight: 0,
    },
    {
      url: 'https://avalanche-mainnet.infura.io/v3/${INFURA_API_KEY}',
      weight: 1,
    },
  ],
  fuji: [
    {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
    },
    {
      url: 'https://rpc.ankr.com/avalanche_fuji',
    },
  ],
  fantom: [
    {
      url: 'https://fantom.drpc.org',
      weight: 1000000,
    },
    {
      url: 'https://rpc.ftm.tools',
      weight: 1000000,
    },
    {
      url: 'https://rpc2.fantom.network',
      weight: 100,
    },
    {
      url: 'https://rpc3.fantom.network',
      weight: 100,
    },
    {
      url: 'https://fantom-pokt.nodies.app',
      weight: 0,
    },
  ],
  'fantom-testnet': [
    {
      url: 'https://rpc.testnet.fantom.network/',
    },
    {
      url: 'https://rpc.ankr.com/fantom_testnet',
    },
    {
      url: 'https://fantom-testnet.public.blastapi.io',
    },
  ],
  arbitrum: [
    {
      url: 'https://arbitrum.drpc.org',
      weight: 1000000,
    },
    {
      url: 'https://arb1.arbitrum.io/rpc',
      weight: 1000000,
    },
    {
      url: 'https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
      weight: 1,
    },
    {
      url: 'https://arb-pokt.nodies.app',
      weight: 0,
    },
    {
      url: 'https://arb-mainnet.g.alchemy.com/v2/N71NRfHZGk2jbnDkW-GiM6fTe6ysJOmp',
      weight: 100,
    },
    {
      url: 'https://arb-mainnet.g.alchemy.com/v2/KhVdIItVH0ttiQvBYYO5NPL-De-gLWoW',
      weight: 100,
    },
    {
      url: 'https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}',
      weight: 1,
    },
  ],
  'arbitrum-goerli': [
    {
      url: 'https://goerli-rollup.arbitrum.io/rpc',
    },
    {
      url: 'https://arb-goerli.g.alchemy.com/v2/bgFeK0bK5LSFZCyBQAnztWaCUgF_b4fE',
    },
  ],
  'arbitrum-rinkeby': [
    {
      url: 'https://rinkeby.arbitrum.io/rpc',
    },
    {
      url: 'https://arb-rinkeby.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    },
  ],
  optimism: [
    {
      url: 'https://optimism.drpc.org',
      weight: 1000000,
    },
    {
      url: 'https://mainnet.optimism.io',
      timeout: 8000,
      weight: 1000000,
    },
    {
      url: 'https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}',
    },
    {
      url: 'https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    },
    {
      url: 'https://opt-mainnet.g.alchemy.com/v2/3glkhRJRgzHCB2NbDwiQa7G_FTdqn3-T',
      weight: 100,
    },
    {
      url: 'https://opt-mainnet.g.alchemy.com/v2/7urLa-8k2RR_UYc0exh-b0qg4xySL5KA',
      weight: 100,
    },
    {
      url: 'https://op-pokt.nodies.app',
      weight: 0,
    },
  ],
  'optimism-kovan': [
    {
      url: 'https://kovan.optimism.io/',
    },
    {
      url: 'https://opt-kovan.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    },
  ],
  'optimism-goerli': [
    {
      url: 'https://goerli.optimism.io',
    },
    {
      url: 'https://optimism-testnet.drpc.org',
    },
  ],
  swimmer: [],
  dfk: [
    {
      url: 'https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc',
    },
  ],
  harmony: [
    {
      url: 'https://harmony-mainnet.chainstacklabs.com',
    },
    {
      url: 'https://api.harmony.one',
    },
    {
      url: 'https://api.s0.t.hmny.io',
    },
    {
      url: 'https://a.api.s0.t.hmny.io',
    },
    {
      url: 'https://rpc.ankr.com/harmony',
    },
    {
      url: 'https://hmyone-pokt.nodies.app',
      weight: 0,
    },
  ],
  aptos: [
    {
      url: 'https://mainnet.aptoslabs.com/v1',
    },
  ],
  'aptos-testnet': [
    {
      url: 'https://fullnode.testnet.aptoslabs.com/v1',
    },
  ],
  moonbeam: [
    {
      url: 'https://rpc.api.moonbeam.network',
    },
    {
      url: 'wss://wss.api.moonbeam.network',
    },
  ],
  metis: [
    {
      url: 'https://metis.drpc.org',
    },
    {
      url: 'https://andromeda.metis.io/?owner=1088',
      weight: 100,
    },
    {
      url: 'https://metis-pokt.nodies.app',
      weight: 0,
    },
  ],
  'metis-goerli': [
    {
      url: 'https://goerli.gateway.metisdevops.link',
    },
  ],
  'dfk-testnet': [
    {
      url: 'https://subnets.avax.network/defi-kingdoms/dfk-chain-testnet/rpc',
    },
  ],
  'harmony-testnet': [
    {
      url: 'https://api.s0.ps.hmny.io',
    },
  ],
  'dexalot-testnet': [
    {
      url: 'https://subnets.avax.network/dexalot/testnet/rpc',
    },
  ],
  kovan: [
    {
      url: 'https://kovan.poa.network',
    },
    {
      url: 'http://kovan.poa.network:8545',
    },
    {
      url: 'https://kovan.infura.io/v3/${INFURA_API_KEY}',
    },
    {
      url: 'wss://kovan.infura.io/ws/v3/${INFURA_API_KEY}',
    },
    {
      url: 'ws://kovan.poa.network:8546',
    },
  ],
  chiado: [
    {
      url: 'https://rpc.chiadochain.net',
    },
    {
      url: 'https://rpc.chiado.gnosis.gateway.fm',
    },
    {
      url: 'wss://rpc.chiadochain.net/wss',
    },
    {
      url: 'https://gnosis-chiado.publicnode.com',
    },
    {
      url: 'wss://gnosis-chiado.publicnode.com',
    },
  ],
  celo: [
    {
      url: 'https://celo.drpc.org',
    },
    {
      url: 'https://forno.celo.org',
    },
    {
      url: 'wss://forno.celo.org/ws',
    },
  ],
  alfajores: [
    {
      url: 'https://alfajores-forno.celo-testnet.org',
    },
    {
      url: 'wss://alfajores-forno.celo-testnet.org/ws',
    },
  ],
  moonbase: [
    {
      url: 'https://rpc.api.moonbase.moonbeam.network',
    },
    {
      url: 'wss://wss.api.moonbase.moonbeam.network',
    },
  ],
  boba: [
    {
      url: 'https://mainnet.boba.network/',
    },
  ],
  'boba-rinkeby': [
    {
      url: 'https://rinkeby.boba.network/',
    },
  ],
  'portal-fantasy-testnet': [
    {
      url: 'https://subnets.avax.network/portal-fantasy/testnet/rpc',
    },
  ],
  aurora: [
    {
      url: 'https://aurora.drpc.org',
    },
    {
      url: 'https://mainnet.aurora.dev',
    },
  ],
  'aurora-testnet': [
    {
      url: 'https://testnet.aurora.dev/',
    },
  ],
  astar: [
    {
      url: 'https://evm.astar.network',
    },
    {
      url: 'https://astar.public.blastapi.io',
    },
  ],
  coredao: [
    {
      url: 'https://rpc.coredao.org/',
    },
    {
      url: 'https://rpc-core.icecreamswap.com',
    },
  ],
  'coredao-testnet': [
    {
      url: 'https://rpc.test.btcs.network/',
    },
  ],
  dexalot: [
    {
      url: 'https://subnets.avax.network/dexalot/mainnet/rpc',
    },
  ],
  dos: [
    {
      url: 'https://main.doschain.com',
    },
  ],
  'dos-testnet': [
    {
      url: 'https://test.doschain.com',
    },
  ],
  fuse: [
    {
      url: 'https://rpc.fuse.io',
      weight: 1000,
    },
    {
      url: 'https://fuse-pokt.nodies.app',
      weight: 0,
    },
  ],
  gnosis: [
    {
      url: 'https://gnosis.drpc.org',
    },
    {
      url: 'https://rpc.gnosischain.com',
    },
    {
      url: 'https://rpc.ankr.com/gnosis',
    },
    {
      url: 'https://gnosis-pokt.nodies.app',
      weight: 0,
    },
    {
      url: 'https://gnosis-mainnet.public.blastapi.io',
    },
    {
      url: 'wss://rpc.gnosischain.com/wss',
    },
  ],
  klaytn: [
    {
      url: 'https://public-node-api.klaytnapi.com/v1/cypress',
    },
    {
      url: 'https://klaytn-pokt.nodies.app',
      weight: 0,
    },
  ],
  'klaytn-baobab': [
    {
      url: 'https://api.baobab.klaytn.net:8651',
    },
  ],
  meter: [
    {
      url: 'https://rpc.meter.io',
    },
  ],
  'meter-testnet': [
    {
      url: 'https://rpctest.meter.io',
    },
  ],
  moonriver: [
    {
      url: 'https://rpc.api.moonriver.moonbeam.network',
    },
    {
      url: 'wss://wss.api.moonriver.moonbeam.network',
    },
  ],
  okx: [
    {
      url: 'https://exchainrpc.okex.org',
    },
  ],
  sepolia: [
    {
      url: 'https://rpc.sepolia.org',
    },
    {
      url: 'https://rpc2.sepolia.org',
    },
    {
      url: 'https://sepolia.drpc.org',
    },
    {
      url: 'https://rpc-sepolia.rockx.com',
    },
    {
      url: 'https://op-sepolia-pokt.nodies.app',
    },
  ],
  zksync: [
    {
      url: 'https://zksync.drpc.org',
    },
    {
      url: 'https://mainnet.era.zksync.io',
    },
  ],
  'zksync-testnet': [
    {
      url: 'https://testnet.era.zksync.dev',
    },
  ],
  'base-goerli': [
    {
      url: 'https://goerli.base.org”',
    },
  ],
  shrapnel: [
    {
      url: 'https://subnets.avax.network/shrapnel/mainnet/rpc',
    },
  ],
  tenet: [
    {
      url: 'https://rpc.tenet.org',
    },
  ],
  'tenet-testnet': [
    {
      url: 'https://rpc.testnet.tenet.org',
    },
  ],
  zkevm: [
    {
      url: 'https://zkevm-rpc.com',
    },
    {
      url: 'https://polygon-zkevm.drpc.org',
    },
  ],
  'zkevm-testnet': [
    {
      url: 'https://rpc.public.zkevm-test.net',
    },
    {
      url: 'https://polygon-zkevm-testnet.drpc.org',
    },
  ],
  canto: [
    {
      url: 'https://canto.slingshot.finance',
    },
    {
      url: 'https://canto.neobase.one',
    },
    {
      url: 'https://mainnode.plexnode.org:8545',
    },
  ],
  'canto-testnet': [
    {
      url: 'https://testnet-archive.plexnode.wtf',
    },
  ],
  nova: [
    {
      url: 'https://arbitrum-nova.drpc.org',
    },
    {
      url: 'https://nova.arbitrum.io/rpc',
    },
  ],
  kava: [
    {
      url: 'https://kava.drpc.org',
    },
    {
      url: 'https://evm.kava.io',
    },
    {
      url: 'https://evm2.kava.io',
    },
    {
      url: 'wss://wevm.kava.io',
    },
    {
      url: 'wss://wevm2.kava.io',
    },
    {
      url: 'https://kava-pokt.nodies.app',
      weight: 0,
    },
  ],
  'kava-testnet': [
    {
      url: 'https://evm.testnet.kava.io',
    },
    {
      url: 'wss://wevm.testnet.kava.io',
    },
  ],
  base: [
    {
      url: 'https://base.drpc.org',
      weight: 1000000,
    },
    {
      url: 'https://mainnet.base.org',
      weight: 1000000,
    },
    {
      url: 'https://base.meowrpc.com',
    },
    {
      url: 'https://base-pokt.nodies.app',
      weight: 0,
    },
    {
      url: 'https://base.blockpi.network/v1/rpc/public',
    },
  ],
  'linea-goerli': [
    {
      url: 'https://rpc.goerli.linea.build',
    },
    {
      url: 'wss://rpc.goerli.linea.build',
    },
    {
      url: 'https://linea-goerli.infura.io/v3/${INFURA_API_KEY}',
    },
    {
      url: 'wss://linea-goerli.infura.io/v3/${INFURA_API_KEY}',
    },
  ],
  linea: [
    {
      url: 'https://linea.drpc.org',
    },
    {
      url: 'https://rpc.linea.build',
    },
    {
      url: 'wss://rpc.linea.build',
    },
    {
      url: 'https://linea-mainnet.infura.io/v3/${INFURA_API_KEY}',
    },
    {
      url: 'wss://linea-mainnet.infura.io/ws/v3/${INFURA_API_KEY}',
    },
  ],
  mantle: [
    {
      url: 'https://rpc.mantle.xyz',
    },
    {
      url: 'https://mantle.drpc.org',
    },
    {
      url: 'https://mantle.publicnode.com',
    },
  ],
  'mantle-testnet': [
    {
      url: 'https://rpc.testnet.mantle.xyz',
    },
  ],
  beam: [
    {
      url: 'https://subnets.avax.network/beam/mainnet/rpc',
    },
  ],
  'beam-testnet': [
    {
      url: 'https://subnets.avax.network/beam/testnet/rpc',
    },
  ],
  'okx-testnet': [
    {
      url: 'https://exchaintestrpc.okex.org',
    },
  ],
  'scroll-testnet': [
    {
      url: 'https://sepolia-rpc.scroll.io',
    },
    {
      url: 'https://rpc.ankr.com/scroll_sepolia_testnet',
    },
    {
      url: 'https://scroll-sepolia.chainstacklabs.com',
    },
    {
      url: 'https://scroll-testnet-public.unifra.io',
    },
  ],
  zora: [
    {
      url: 'https://rpc.zora.energy/',
    },
  ],
  telos: [
    {
      url: 'https://mainnet.telos.net/evm',
    },
  ],
  'telos-testnet': [
    {
      url: 'https://testnet.telos.net/evm',
    },
  ],
  'conflux-testnet': [
    {
      url: 'https://evmtestnet.confluxrpc.com',
    },
  ],
  opbnb: [
    {
      url: 'https://opbnb.drpc.org',
    },
    {
      url: 'https://opbnb-mainnet-rpc.bnbchain.org',
    },
    {
      url: 'https://opbnb.publicnode.com',
    },
    {
      url: 'wss://opbnb.publicnode.com',
    },
  ],
  conflux: [
    {
      url: 'https://evm.confluxrpc.com',
    },
  ],
  'opbnb-testnet': [
    {
      url: 'https://opbnb-testnet-rpc.bnbchain.org',
    },
  ],
  scroll: [
    {
      url: 'https://scroll.drpc.org',
    },
    {
      url: 'https://rpc.scroll.io',
    },
    {
      url: 'https://rpc-scroll.icecreamswap.com',
    },
    {
      url: 'https://rpc.ankr.com/scroll',
    },
    {
      url: 'https://scroll-mainnet.chainstacklabs.com',
    },
  ],
  orderly: [
    {
      url: 'https://rpc.orderly.network',
    },
    {
      url: 'https://l2-orderly-mainnet-0.t.conduit.xyz',
    },
  ],
  'astar-testnet': [
    {
      url: 'https://rpc-1.japanopenchain.org:8545',
    },
    {
      url: 'https://rpc-2.japanopenchain.org:8545',
    },
  ],
  eon: [
    {
      url: 'https://eon-rpc.horizenlabs.io/ethv1',
    },
    {
      url: 'https://rpc.ankr.com/horizen_eon',
    },
  ],
  'eon-testnet': [
    {
      url: 'https://gobi-rpc.horizenlabs.io/ethv1',
    },
    {
      url: 'https://rpc.ankr.com/horizen_gobi_testnet',
    },
  ],
  'frame-testnet': [
    {
      url: 'https://rpc.testnet.frame.xyz/http',
    },
  ],
  'holesky-testnet': [
    {
      url: 'https://rpc.holesky.ethpandaops.io',
    },
    {
      url: 'https://ethereum-holesky.publicnode.com',
    },
    {
      url: 'wss://ethereum-holesky.publicnode.com',
    },
  ],
  'kiwi-testnet': [
    {
      url: 'https://subnets.avax.network/kiwi/testnet/rpc',
    },
  ],
  manta: [
    {
      url: 'https://pacific-rpc.manta.network/http	',
    },
  ],
  'manta-testnet': [
    {
      url: 'https://manta-testnet.calderachain.xyz/http',
    },
  ],
  'oda-testnet': [
    {
      url: 'https://evm.cronos.org',
    },
    {
      url: 'https://cronos-evm.publicnode.com',
    },
    {
      url: 'wss://cronos-evm.publicnode.com',
    },
  ],
  'orderly-testnet': [
    {
      url: 'https://l2-orderly-l2-4460-sepolia-8tc3sd7dvy.t.conduit.xyz',
    },
  ],
  pgn: [
    {
      url: 'https://rpc.publicgoods.network',
    },
  ],
  'pgn-testnet': [
    {
      url: 'https://sepolia.publicgoods.network',
    },
  ],
  shimmer: [
    {
      url: 'https://json-rpc.evm.shimmer.network',
    },
  ],
  'shimmer-testnet': [
    {
      url: 'https://json-rpc.evm.testnet.shimmer.network',
    },
  ],
  'shrapnel-testnet': [
    {
      url: 'https://subnets.avax.network/shrapnel/testnet/rpc',
    },
  ],
  'spruce-testnet': [
    {
      url: 'https://rpc.testnet.fastexchain.com',
    },
  ],
  tomo: [
    {
      url: 'https://rpc.tomochain.com',
    },
  ],
  'tomo-testnet': [
    {
      url: 'https://rpc.testnet.tomochain.com',
    },
  ],
  xpla: [
    {
      url: 'https://dimension-evm-rpc.xpla.dev',
    },
  ],
  'xpla-testnet': [
    {
      url: 'https://aic.acria.ai',
    },
  ],
  'zkatana-testnet': [
    {
      url: 'https://rpc.zkatana.gelato.digital',
    },
    {
      url: 'https://rpc.startale.com/zkatana',
    },
  ],
  'zora-testnet': [
    {
      url: 'https://gwan-ssl.wandevs.org:46891/',
    },
  ],
  'arbitrum-sepolia': [
    {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
    },
    {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
    },
  ],
  'optimism-sepolia': [
    {
      url: 'https://sepolia.optimism.io',
    },
  ],
  xchain: [
    {
      url: 'https://xchain-rpc.idex.io',
    },
  ],
  'xchain-testnet': [
    {
      url: 'https://xchain-testnet-rpc.idex.io',
    },
  ],
  blast: [
    {
      url: 'https://rpc.blast.io',
    },
    {
      url: 'https://rpc.ankr.com/blast',
    },
    {
      url: 'https://blast.din.dev/rpc',
    },
    {
      url: 'https://blastl2-mainnet.public.blastapi.io',
    },
    {
      url: 'https://blast.blockpi.network/v1/rpc/public',
    },
  ],
  mode: [
    {
      url: 'https://mainnet.mode.network',
    },
    {
      url: 'https://1rpc.io/mode',
    },
  ],
  fraxtal: [
    {
      url: 'https://rpc.frax.com',
    },
  ],
  zkatana: [
    {
      url: 'https://rpc.startale.com/astar-zkevm',
    },
  ],
  ebi: [
    {
      url: 'https://rpc.ebi.xyz',
    },
  ],
  taiko: [
    {
      url: 'https://rpc.taiko.xyz',
    },
    {
      url: 'https://rpc.taiko.tools',
    },
    {
      url: 'https://rpc.ankr.com/taiko',
    },
    {
      url: 'https://taiko.blockpi.network/v1/rpc/public',
    },
  ],
  ton: [
    {
      url: 'https://toncenter.com/api/v2/jsonRPC',
    },
    // {
    //   url: 'https://rpc.ankr.com/http/ton_api_v2',
    // }
  ],
  sei: [
    {
      url: 'https://evm-rpc.sei-apis.com',
    },
  ],
  rarible: [
    {
      url: 'https://mainnet.rpc.rarichain.org/http',
    },
  ],
  xlayer: [
    {
      url: 'https://rpc.xlayer.tech',
    },
    {
      url: 'https://xlayerrpc.okx.com',
    },
  ],
};
