export interface PresentationDeploymentDetailed {
    name: string;
    showOnlyExternallyConnected: boolean;
}

export type PresentationDeployment = string | PresentationDeploymentDetailed;

export interface Presentation {
    title: string;
    deployments: PresentationDeployment[];
}
