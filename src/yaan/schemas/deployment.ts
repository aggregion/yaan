export interface DeploymentExternalConnection {
    namespace?: string;
    deployment?: string;
    deploymentGroup?: string;
    component: string;
    port?: string;
}

export interface DeploymentComponentDetailed {
    disabled?: false;
    name: string;
    externalConnections?: DeploymentExternalConnection[];
}

export interface DeploymentComponentDisabled {
    name: string;
    disabled: true;
}

export type DeploymentComponent =
    | DeploymentComponentDetailed
    | DeploymentComponentDisabled
    | '*'
    | string;

interface CommonDeploymentGroupProps {
    title?: string;
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
    deploymentGroups: Record<string, DeploymentGroup>;
}
