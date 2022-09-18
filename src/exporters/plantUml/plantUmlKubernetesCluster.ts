import { PlantUmlObject } from './plantUmlObject';
import { KubernetesCluster } from '../../yaan/schemas/kubernetesCluster';
import { escapeStr } from './helpers';

export class PlantUmlKubernetesCluster extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly cluster: KubernetesCluster,
        public readonly showDetails: boolean,
    ) {
        super(id);
    }

    private renderProps(): string {
        if (!this.showDetails) {
            return '';
        }
        const props = [];
        if (this.cluster.distribution) {
            props.push(
                `AddProperty("Distribution", "${escapeStr(
                    this.cluster.distribution,
                )}")`,
            );
        }
        if (this.cluster.version) {
            props.push(
                `AddProperty("Version", "${escapeStr(this.cluster.version)}")`,
            );
        }
        return props.join('\n');
    }

    protected get header(): string {
        return `
        ${this.renderProps()}
        Deployment_Node("${this.id}", "${
            this.showDetails ? escapeStr(this.cluster.title) : '***'
        }", "Kubernetes Cluster", "", $sprite=kubernetes, $tags="kubernetesCluster${
            !this.showDetails ? ',hidden' : ''
        }"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
