import { PlantUmlObject } from './plantUmlObject';
import { KubernetesCluster } from '../../yaan/schemas/kubernetesCluster';

export class PlantUmlKubernetesCluster extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly cluster: KubernetesCluster,
    ) {
        super(id);
    }

    private renderProps(): string {
        const props = [];
        if (this.cluster.distribution) {
            props.push(
                `AddProperty("Distribution", "${this.cluster.distribution}")`,
            );
        }
        if (this.cluster.version) {
            props.push(`AddProperty("Version", "${this.cluster.version}")`);
        }
        return props.join('\n');
    }

    protected get header(): string {
        return `
        ${this.renderProps()}
        Deployment_Node_L("${this.id}", "${
            this.cluster.title
        }", "Kubernetes Cluster", "", $sprite=kubernetes, $tags=kubernetesCluster){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
