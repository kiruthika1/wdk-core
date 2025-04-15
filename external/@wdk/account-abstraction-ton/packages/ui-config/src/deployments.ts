import deploymentsV1JSON from '../config/deploymentsV1.json';
import deploymentsV2JSON from '../config/deploymentsV2.json';
import type {Deployment, DeploymentV1, DeploymentV2} from './types';

export const deploymentsV1: DeploymentV1[] = deploymentsV1JSON as DeploymentV1[];
export const deploymentsV2: DeploymentV2[] = deploymentsV2JSON as DeploymentV2[];
export const deployments: Deployment[] = [...deploymentsV1, ...deploymentsV2];
