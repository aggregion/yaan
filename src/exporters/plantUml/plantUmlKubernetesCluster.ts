import { PlantUmlObject } from './plantUmlObject';
import { KubernetesCluster } from '../../yaan/schemas/kubernetesCluster';

export class PlantUmlKubernetesCluster extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly cluster: KubernetesCluster,
    ) {
        super(id);
    }

    protected get header(): string {
        return `
        AddProperty("Distribution", "${this.cluster.distribution}")
        AddProperty("Version", "${this.cluster.version}")
        Deployment_Node_L("${this.id}", "${this.cluster.title}", "Kubernetes Cluster", "", $sprite=kubernetes, $tags=kubernetesCluster){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
