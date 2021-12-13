import { PlantUmlObject } from './plantUmlObject';
import {
    SolutionPort,
    SolutionPortDetailed,
} from '../../yaan/schemas/solution';

export class PlantUmlComponentPort extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly port: SolutionPort,
        public readonly portName: string,
    ) {
        super(id);
    }

    protected get header(): string {
        const port: SolutionPortDetailed =
            typeof this.port === 'object'
                ? this.port
                : {
                      number: this.port,
                      description: '',
                      protocol: 'TCP',
                  };
        return `
        AddProperty("${port.protocol || 'TCP'}", "${port.number}")
        Deployment_Node_L("${this.id}", "${
            this.portName || port.description
        }", "Port", "${port.description || ''}") {
        `;
    }

    protected get footer(): string {
        return `
        }`;
    }
}
