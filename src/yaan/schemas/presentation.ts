import { EntityType } from './configContainer';

export interface PresentationDeploymentDetailed {
    name: string;
    showOnlyExternallyConnected: boolean;
}

export type PresentationDeployment = string | PresentationDeploymentDetailed;

export interface PresentationInclude {
    kind: EntityType;
    name: string;
}

export interface Presentation {
    title: string;
    deployments: PresentationDeployment[];
    include?: PresentationInclude[];
}
