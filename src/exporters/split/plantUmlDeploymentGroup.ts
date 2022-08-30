import { PlantUmlObject } from './plantUmlObject';
import { DeploymentGroup } from '../../yaan/schemas/deployment';

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
        Deployment_Node("${this.id}", "${
            this.deploymentGroup.title || ' '
        }", "Deployment group", "", $tags="deploymentGroup${
            !this.showDetails ? ',hidden' : ''
        }"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
