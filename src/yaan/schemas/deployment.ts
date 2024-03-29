export interface DeploymentExternalConnectionToComponent {
    namespace?: string;
    deployment?: string;
    deploymentGroup?: string;
    component: string;
    port?: string;
    description?: string;
}

export type DeploymentExternalConnection =
    DeploymentExternalConnectionToComponent;

export interface DeploymentComponentDetailed {
    disabled?: boolean;
    name: string;
    externalConnections?: DeploymentExternalConnection[];
    namespace?: string;
}

export interface DeploymentComponentFromGroup {
    fromGroup: string;
    namespace?: string;
    disabled?: boolean;
}

export type DeploymentComponent =
    | DeploymentComponentFromGroup
    | DeploymentComponentDetailed
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
    nodes?: string[];
}

export interface ServerDeploymentGroup extends CommonDeploymentGroupProps {
    type: 'Server';
    server: string;
    method?: string;
}

export interface ExternalDeploymentGroup extends CommonDeploymentGroupProps {
    type: 'External';
    owner?: string;
}

export type DeploymentGroup =
    | KubernetesClusterDeploymentGroup
    | ServerDeploymentGroup
    | ExternalDeploymentGroup;

export interface Deployment {
    title: string;
    doc?: string;
    description?: string;
    deploymentGroups: Record<string, DeploymentGroup>;
}
