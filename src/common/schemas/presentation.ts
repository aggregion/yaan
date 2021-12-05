export enum PresentationExternalConnectionsPolicy {
    Show = 'Show',
    Hide = 'Hide',
    Mask = 'Mask',
}

export interface PresentationDeploymentDetailed {
    name: string;
    externalConnectionsPolicy?: PresentationExternalConnectionsPolicy;
}

export type PresentationDeployment = string | PresentationDeploymentDetailed;

export interface Presentation {
    title: string;
    deployments: PresentationDeployment[];
}
