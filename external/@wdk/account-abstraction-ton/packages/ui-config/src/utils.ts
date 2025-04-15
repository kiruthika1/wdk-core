import path from 'path';
import fs from 'fs';
import degit from 'tiged';
import {globSync} from 'glob';
import {
  networkToStage,
  networkToEndpointId,
  EndpointVersion,
  endpointIdToChainKey,
} from '@layerzerolabs/lz-definitions';
import type {DeploymentV2, DeploymentV1, DVN} from './types';

const DEPRECATED_CHAINS: string[] = ['base-goerli', 'goerli', 'zksync-testnet'];

const DEPRECATED_ENDPOINTS: number[] = [
  10234, // chainKey: venn-testnet
  10237, // chainKey: xchain-testnet
  40158, // zkpolygon
  40172, // kava-testnet
  40195, // wanchain-testnet,zora-testnet
  40201, // aurora-testnet
  40234, // venn-testnet
  40237, // xchain-testnet
];

const PRIVATE_CHAINS: string[] = ['rc1-testnet', 'tiltyard', 'tron-testnet', 'zksync-sepolia'];
const PRIVATE_ENDPOINTS: number[] = [
  10206, // chainKey: spruce-testnet
  10207, // chainKey: pgjjtk-testnet
  10208, // chainKey: oda-testnet
  10209, // chainKey: kiwi-testnet
  10233, // chainKey: bera-testnet
  10236, // gunzilla-testnet
  10241, // chainKey: kiwi2-testnet
  40259, // exocore-testnet
];

const DVNS: {[fileName: string]: {name: string; provider: string}} = {
  'DVNBlockhunters.json': {
    provider: 'blockhunters',
    name: 'Blockhunters',
  },
  'DVNBlockdaemon.json': {
    provider: 'blockdaemon',
    name: 'Blockdaemon',
  },
  'DVNBware.json': {
    provider: 'bware',
    name: 'Bware',
  },
  'DVNHorizen.json': {
    provider: 'horizen',
    name: 'Horizen',
  },
  'DVNGCDA.json': {
    provider: 'gcda',
    name: 'GCDA',
  },
  'DVNTapioca.json': {
    provider: 'tapioca',
    name: 'Tapioca',
  },
  'DVNPlanetarium.json': {
    provider: 'planetarium',
    name: 'Planetarium',
  },
  'DVNNodesguru.json': {
    provider: 'nodesguru',
    name: 'Nodesguru',
  },
  'DVNNethermind.json': {
    provider: 'nethermind',
    name: 'Nethermind',
  },
  'DVNAnimoca.json': {
    provider: 'animoca',
    name: 'Animoca',
  },
  'DVNLagrange.json': {
    provider: 'lagrange',
    name: 'Lagrange',
  },
  'DVNStablelab.json': {
    provider: 'stablelab',
    name: 'Stablelab',
  },
  'DVNRepublic.json': {
    provider: 'republic',
    name: 'Republic',
  },
  'DVNNocturnal.json': {
    provider: 'nocturnal',
    name: 'Nocturnal',
  },
  'DVNMIM.json': {
    provider: 'mim',
    name: 'MIM',
  },
  'CCIPDVNAdapter.json': {
    provider: 'ccip',
    name: 'CCIP',
  },
  'AxelarDVNAdapter.json': {
    provider: 'axelar',
    name: 'Axelar',
  },
  // to-do: add 3rd party DVNs (e.g., polyhedra)
};

export async function readV2DvnsFromMonorepo() {
  const url =
    'https://github.com/LayerZero-Labs/monorepo/packages/layerzero-v2/evm/sdk/deployments';
  const tempPath = path.resolve(fs.mkdtempSync('temp-deployments-'));
  const log = console;
  try {
    log.info(`Downloading deployments from ${url} to ${tempPath}`);
    await degit(url, {mode: 'git', disableCache: false}).clone(tempPath);

    const deploymentsPaths = globSync(path.join(tempPath, './*/'));
    const dvns: DVN[] = [];
    for (const deploymentPath of deploymentsPaths) {
      const network = path.basename(deploymentPath);
      try {
        const eid = networkToEndpointId(network, EndpointVersion.V2);
        const chainKey = endpointIdToChainKey(eid);

        if (PRIVATE_CHAINS.includes(chainKey)) continue;
        if (PRIVATE_ENDPOINTS.includes(eid)) continue;
        for (const fileName in DVNS) {
          const name = DVNS[fileName].name;
          const address = tryGetAddress(deploymentPath, fileName);
          if (!address) continue;
          const dvn: DVN = {
            name,
            address,
            chainKey,
            eid,
          };
          dvns.push(dvn);
        }
      } catch (e) {
        if (e instanceof Error) {
          log.error(`Could not get deployment for ${network}: ${e.message}`);
        }
        log.error(e);
      }
    }
    return sortByEid(sortByName(dvns));
  } finally {
    fs.rmdirSync(tempPath, {recursive: true});
  }
}

export async function readV2DeploymentsFromMonorepo() {
  const url =
    'https://github.com/LayerZero-Labs/monorepo/packages/layerzero-v2/evm/sdk/deployments';
  const tempPath = path.resolve(fs.mkdtempSync('temp-deployments-'));
  const log = console;
  try {
    log.info(`Downloading deployments from ${url} to ${tempPath}`);
    await degit(url, {mode: 'git', disableCache: false}).clone(tempPath);

    const deploymentsPaths = globSync(path.join(tempPath, './*/'));
    const deployments: DeploymentV2[] = [];
    for (const deploymentPath of deploymentsPaths) {
      const network = path.basename(deploymentPath);
      try {
        const stage = networkToStage(network);
        const eid = networkToEndpointId(network, EndpointVersion.V2);
        const chainKey = endpointIdToChainKey(eid);

        if (PRIVATE_CHAINS.includes(chainKey)) continue;
        if (PRIVATE_ENDPOINTS.includes(eid)) continue;
        if (stage === 'sandbox') continue;

        const isDeprecated =
          DEPRECATED_CHAINS.includes(chainKey) || DEPRECATED_ENDPOINTS.includes(eid) || undefined;
        const lzExecutor = tryGetContract(deploymentPath, 'LzExecutor.json');
        const endpointV2 = tryGetContract(deploymentPath, 'EndpointV2.json');
        const executor = tryGetContract(deploymentPath, 'Executor.json');
        const sendUln301 = tryGetContract(deploymentPath, 'SendUln301.json');
        const sendUln302 = tryGetContract(deploymentPath, 'SendUln302.json');
        const receiveUln301 = tryGetContract(deploymentPath, 'ReceiveUln301.json');
        const receiveUln302 = tryGetContract(deploymentPath, 'ReceiveUln302.json');
        if (!endpointV2) throw new Error(`No endpointV2 found for ${network}`);

        const deployment: DeploymentV2 = {
          version: 2,
          stage,
          eid,
          chainKey,
          isDeprecated,
          executor,
          lzExecutor,
          endpointV2,
          sendUln301,
          sendUln302,
          receiveUln301,
          receiveUln302,
        };
        deployments.push(deployment);
      } catch (e) {
        if (e instanceof Error) {
          log.error(`Could not get deployment for ${network}: ${e.message}`);
        }
        log.error(e);
      }
    }
    return sortByEid(deployments);
  } finally {
    fs.rmdirSync(tempPath, {recursive: true});
  }
}

export async function readDeploymentsFromApi() {
  const url = 'https://metadata.layerzero-api.com/v1/metadata/deployments';
  const data: Record<
    string,
    {
      deployments: any[];
      dvns: Record<string, any>;
    }
  > = await (await fetch(url)).json();
  return Object.entries(data)
    .map(([chainKey, config]) => {
      const deployments = config.deployments || [];
      return deployments.map((deployment) => ({
        ...deployment,
        eid: Number(deployment.eid),
      }));
    })
    .flat();
}

export async function readDvnsFromApi() {
  const url = 'https://metadata.layerzero-api.com/v1/metadata/deployments';
  const data: Record<
    string,
    {
      deployments: any[];
      dvns: Record<string, any>;
    }
  > = await (await fetch(url)).json();
  return Object.entries(data)
    .map(([chainKey, config]) => {
      const dvns = config.dvns || {};
      const versionEids: Record<number, number> =
        config.deployments?.reduce((versionMap, deployment) => {
          return {
            ...versionMap,
            [deployment.version]: Number(deployment.eid),
          };
        }, {}) || {};
      return Object.entries(dvns).map(([address, dvnConfig]) => {
        return {
          name: dvnConfig.canonicalName,
          address,
          chainKey,
          eid: versionEids[dvnConfig.version] ?? 0,
        };
      });
    })
    .flat();
}

export async function readV1DeploymentsFromMonorepo() {
  const url = 'https://github.com/LayerZero-Labs/monorepo/packages/layerzero-v1/evm/sdk';
  const tempPath = path.resolve(fs.mkdtempSync('temp-deployments-'));
  const log = console;
  try {
    log.info(`Downloading deployments from ${url} to ${tempPath}`);
    await degit(url, {mode: 'git', disableCache: false}).clone(tempPath);

    const deploymentsPaths = globSync(`${tempPath}/deployments/*/`);

    const deployments: DeploymentV1[] = [];

    for (const deploymentPath of deploymentsPaths) {
      const network = path.basename(deploymentPath);

      try {
        const stage = networkToStage(network);
        const eid = networkToEndpointId(network, EndpointVersion.V1);
        const chainKey = endpointIdToChainKey(eid);

        if (PRIVATE_CHAINS.includes(chainKey)) continue;
        if (PRIVATE_ENDPOINTS.includes(eid)) continue;
        if (stage === 'sandbox') continue;

        const isDeprecated =
          DEPRECATED_CHAINS.includes(chainKey) || DEPRECATED_ENDPOINTS.includes(eid) || undefined;
        const endpoint = tryGetContract(deploymentPath, 'Endpoint.json');
        const relayer = tryGetContract(deploymentPath, 'Relayer.json');
        const relayerV2 = tryGetContract(deploymentPath, 'RelayerV2.json');
        const ultraLightNode = tryGetContract(deploymentPath, 'UltraLightNode.json');
        const ultraLightNodeV2 = tryGetContract(deploymentPath, 'UltraLightNodeV2.json');
        if (!endpoint) throw new Error(`No endpoint found for ${network}`);

        const deployment: DeploymentV1 = {
          version: 1,
          stage,
          eid,
          chainKey,
          endpoint,
          isDeprecated,
          relayer,
          relayerV2,
          ultraLightNode,
          ultraLightNodeV2,
        };
        deployments.push(deployment);
      } catch (e) {
        if (e instanceof Error) {
          log.error(`Could not get deployment for ${network}: ${e.message}`);
        }
        log.error(e);
      }
    }
    return sortByEid(deployments);
  } finally {
    fs.rmdirSync(tempPath, {recursive: true});
  }
}

const tryGetContract = (dirPath: string, fileName: string) => {
  const address = tryGetAddress(dirPath, fileName);
  return address ? {address} : undefined;
};

function tryGetAddress(dirPath: string, fileName: string) {
  const filePath = path.join(dirPath, fileName);
  if (!fs.existsSync(filePath)) return undefined;
  const address = JSON.parse(fs.readFileSync(filePath, 'utf8')).address;
  if (typeof address === 'string') return address.toLowerCase();
  return undefined;
}

function sortByEid<T extends {eid: number}>(deployments: T[]) {
  return deployments.sort((a, b) => a.eid - b.eid);
}

function sortByName<T extends {name: string}>(dvns: T[]) {
  return dvns.sort((a, b) => a.name.localeCompare(b.name));
}
