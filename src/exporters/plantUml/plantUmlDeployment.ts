import { PlantUmlObject } from './plantUmlObject';
import { Deployment } from '../../yaan/schemas/deployment';

export class PlantUmlDeployment extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly deployment: Deployment,
        public readonly showDetails: boolean,
    ) {
        super(id);
    }

    protected get header(): string {
        return `
        Deployment_Node("${this.id}", "${this.deployment.title || ''}", "${
            this.deployment.description || ''
        }", "", $tags="deployment${!this.showDetails ? ',hidden' : ''}"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
