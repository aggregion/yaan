import { PlantUmlObject } from './plantUmlObject';
import { DeploymentGroup } from '../../yaan/schemas/deployment';
import { escapeStr } from './helpers';

export class PlantUmlDeploymentGroup extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly deploymentGroup: DeploymentGroup,
        public readonly showDetails: boolean,
    ) {
        super(id);
    }

    protected get header(): string {
        return `
        Boundary("${this.id}", "${escapeStr(
            this.deploymentGroup.title || ' ',
        )}", "${
            this.deploymentGroup.type === 'KubernetesCluster' &&
            this.deploymentGroup.clusterNamespace
                ? `Namespace: ${this.deploymentGroup.clusterNamespace}`
                : ''
        }", $tags="deploymentGroup${!this.showDetails ? ',hidden' : ''}"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
