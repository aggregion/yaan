import { Solution } from './solution';
import { KubernetesCluster } from './kubernetesCluster';
import { Provider } from './provider';
import { Server } from './server';
import { Deployment } from './deployment';

export interface CommonConfigContainerAttributes {
    apiVersion: string;
    metadata: {
        name: string;
        title: string;
    };
}

/**
 * Describes application solution with it's components
 */
export interface SolutionContainer extends CommonConfigContainerAttributes {
    kind: 'Solution';
    spec: Solution;
}

/**
 * Describes Kubernetes cluster
 */
export interface KubernetesClusterContainer
    extends CommonConfigContainerAttributes {
    kind: 'KubernetesCluster';
    spec: KubernetesCluster;
}

/**
 * Describes provider like AWS, Google Cloud etc.
 */
export interface ProviderContainer extends CommonConfigContainerAttributes {
    kind: 'Provider';
    spec: Provider;
}

/**
 * Describes specific server or server's pool
 */
export interface ServerContainer extends CommonConfigContainerAttributes {
    kind: 'Server';
    spec: Server;
}

/**
 * Describes deployment
 */
export interface DeploymentContainer extends CommonConfigContainerAttributes {
    kind: 'Deployment';
    spec: Deployment;
}

export type ConfigContainer =
    | SolutionContainer
    | KubernetesClusterContainer
    | ProviderContainer
    | ServerContainer
    | DeploymentContainer;
