export interface DeploymentExternalConnection {
    namespace?: string;
    deployment?: string;
    deploymentGroup?: string;
    component: string;
}

export interface DeploymentComponentDetailed {
    disabled: undefined;
    name: string;
    externalConnections?: DeploymentExternalConnection[];
}

export interface DeploymentComponentDisabled {
    disabled: true;
}

export type DeploymentComponent =
    | DeploymentComponentDetailed
    | DeploymentComponentDisabled
    | '*';

interface CommonDeploymentGroupProps {
    solution: string;
    components?: DeploymentComponent[];
}

export interface KubernetesClusterDeploymentGroup
    extends CommonDeploymentGroupProps {
    type: 'KubernetesCluster';
    cluster: string;
    clusterNamespace?: string;
}

export interface ServerDeploymentGroup extends CommonDeploymentGroupProps {
    type: 'Server';
    server: string;
    method?: string;
}

export type DeploymentGroup =
    | KubernetesClusterDeploymentGroup
    | ServerDeploymentGroup;

export interface Deployment {
    title: string;
    description?: string;
    deploymentGroups?: Record<string, DeploymentGroup>;
}
