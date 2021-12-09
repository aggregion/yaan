import { Solution } from './solution';
import { KubernetesCluster } from './kubernetesCluster';
import { Provider } from './provider';
import { Server } from './server';
import { Deployment } from './deployment';
import { Presentation } from './presentation';

export enum EntityType {
    Solution = 'Solution',
    KubernetesCluster = 'KubernetesCluster',
    Provider = 'Provider',
    Server = 'Server',
    Deployment = 'Deployment',
    Presentation = 'Presentation',
}

export interface EntityTypeBinding {
    Solution: Solution;
    KubernetesCluster: KubernetesCluster;
    Provider: Provider;
    Server: Server;
    Deployment: Deployment;
    Presentation: Presentation;
}

export type YaanEntity =
    | Solution
    | KubernetesCluster
    | Provider
    | Server
    | Deployment
    | Presentation;

export interface CommonConfigContainerAttributes {
    apiVersion: string;
    kind: EntityType;
    metadata: {
        name: string;
    };
    spec: any;
}

/**
 * Describes application solution with it's components
 */
export interface SolutionContainer extends CommonConfigContainerAttributes {
    kind: EntityType.Solution;
    spec: Solution;
}

/**
 * Describes Kubernetes cluster
 */
export interface KubernetesClusterContainer
    extends CommonConfigContainerAttributes {
    kind: EntityType.KubernetesCluster;
    spec: KubernetesCluster;
}

/**
 * Describes provider like AWS, Google Cloud etc.
 */
export interface ProviderContainer extends CommonConfigContainerAttributes {
    kind: EntityType.Provider;
    spec: Provider;
}

/**
 * Describes specific server or server's pool
 */
export interface ServerContainer extends CommonConfigContainerAttributes {
    kind: EntityType.Server;
    spec: Server;
}

/**
 * Describes deployment
 */
export interface DeploymentContainer extends CommonConfigContainerAttributes {
    kind: EntityType.Deployment;
    spec: Deployment;
}

/**
 * Describes presentation view
 */
export interface PresentationContainer extends CommonConfigContainerAttributes {
    kind: EntityType.Presentation;
    spec: Presentation;
}

export type ConfigContainer =
    | SolutionContainer
    | KubernetesClusterContainer
    | ProviderContainer
    | ServerContainer
    | DeploymentContainer
    | PresentationContainer;
