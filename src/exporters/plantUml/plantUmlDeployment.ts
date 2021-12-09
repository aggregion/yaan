import { PlantUmlObject } from './plantUmlObject';
import { Deployment } from '../../yaan/schemas/deployment';

export class PlantUmlDeployment extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly deployment: Deployment,
    ) {
        super(id);
    }

    protected get header(): string {
        return `
        Deployment_Node_L("${this.id}", "${this.deployment.title || ''}", "${
            this.deployment.description || ''
        }", "", $tags=deployment){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
