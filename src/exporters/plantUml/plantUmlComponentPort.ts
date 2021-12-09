import { PlantUmlObject } from './plantUmlObject';
import { SolutionPortDetailed } from '../../yaan/schemas/solution';

export class PlantUmlComponentPort extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly port: SolutionPortDetailed & { title: string },
    ) {
        super(id);
    }

    protected get header(): string {
        return `
        AddProperty("${this.port.protocol || 'TCP'}", "${this.port.number}")
        Deployment_Node_L("${this.id}", "${this.port.title || ''}", "Port", "${
            this.port.description || ''
        }") {
        `;
    }

    protected get footer(): string {
        return `
        }`;
    }
}
