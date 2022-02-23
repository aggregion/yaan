import { Solution } from './solution';
import { KubernetesCluster } from './kubernetesCluster';
import { Provider } from './provider';
import { Server } from './server';
import { Storage } from './storage';
import { Deployment } from './deployment';
import { Presentation } from './presentation';
import { Organization } from './organization';
import { Person } from './person';

export interface EntityTypeBinding {
    Solution: Solution;
    KubernetesCluster: KubernetesCluster;
    Provider: Provider;
    Server: Server;
    Storage: Storage;
    Deployment: Deployment;
    Presentation: Presentation;
    Organization: Organization;
    Person: Person;
}

export type EntityType = keyof EntityTypeBinding;

export interface CommonConfigContainerAttributes {
    apiVersion: string;
    kind: EntityType;
    metadata: {
        name: string;
        organization?: string;
    };
    spec: any;
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
 * Describes specific storage
 */
export interface StorageContainer extends CommonConfigContainerAttributes {
    kind: 'Storage';
    spec: Storage;
}

/**
 * Describes deployment
 */
export interface DeploymentContainer extends CommonConfigContainerAttributes {
    kind: 'Deployment';
    spec: Deployment;
}

/**
 * Describes presentation view
 */
export interface PresentationContainer extends CommonConfigContainerAttributes {
    kind: 'Presentation';
    spec: Presentation;
}

/**
 * Describes organization
 */
export interface OrganizationContainer extends CommonConfigContainerAttributes {
    kind: 'Organization';
    spec: Organization;
}

/**
 * Describes person
 */
export interface PersonContainer extends CommonConfigContainerAttributes {
    kind: 'Person';
    spec: Person;
}

export type ConfigContainer =
    | SolutionContainer
    | KubernetesClusterContainer
    | ProviderContainer
    | ServerContainer
    | StorageContainer
    | DeploymentContainer
    | PresentationContainer
    | OrganizationContainer
    | PersonContainer;
