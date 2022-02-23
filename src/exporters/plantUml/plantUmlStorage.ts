import { PlantUmlObject } from './plantUmlObject';
import { Storage } from '../../yaan/schemas/storage';

export class PlantUmlStorage extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly storage: Storage,
        public readonly showDetails: boolean,
    ) {
        super(id);
    }

    private renderProps(): string {
        if (!this.showDetails) {
            return '';
        }
        const props = [];
        if (this.storage.protocol) {
            props.push(`AddProperty("Protocol", "${this.storage.protocol}")`);
        }
        return props.join('\n');
    }

    protected get header(): string {
        return `
        ${this.renderProps()}
        Deployment_Node("${this.id}", "${
            this.showDetails ? this.storage.title : '***'
        }", "Storage", "", $tags="kubernetesCluster${
            !this.showDetails ? ',hidden' : ''
        }"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
