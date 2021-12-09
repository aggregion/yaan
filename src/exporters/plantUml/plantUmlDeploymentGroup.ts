import { PlantUmlObject } from './plantUmlObject';
import { DeploymentGroup } from '../../yaan/schemas/deployment';

export class PlantUmlDeploymentGroup extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly deploymentGroup: DeploymentGroup,
    ) {
        super(id);
    }

    protected get header(): string {
        return `
        Deployment_Node_L("${this.id}", "${
            this.deploymentGroup.title || ' '
        }", "Deployment group", "", $tags=deploymentGroup){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
