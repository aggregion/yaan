import { ProjectContainer } from './types';
import { EntityTypeBinding } from './schemas/configContainer';

export class Project implements ProjectContainer {
    public readonly deployments: Map<string, EntityTypeBinding['Deployment']> =
        new Map();
    public readonly kubernetesClusters: Map<
        string,
        EntityTypeBinding['KubernetesCluster']
    > = new Map();
    public readonly presentations: Map<
        string,
        EntityTypeBinding['Presentation']
    > = new Map();
    public readonly providers: Map<string, EntityTypeBinding['Provider']> =
        new Map();
    public readonly servers: Map<string, EntityTypeBinding['Server']> =
        new Map();
    public readonly solutions: Map<string, EntityTypeBinding['Solution']> =
        new Map();
}
