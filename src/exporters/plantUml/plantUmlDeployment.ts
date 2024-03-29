import { PlantUmlObject } from './plantUmlObject';
import { Deployment } from '../../yaan/schemas/deployment';
import { escapeStr } from './helpers';

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
        Boundary("${this.id}", "${escapeStr(
            this.deployment.title || '',
        )}", "Deployment", "${escapeStr(
            this.deployment.description || '',
        )}", "", $tags="deployment${!this.showDetails ? '+hidden' : ''}"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
