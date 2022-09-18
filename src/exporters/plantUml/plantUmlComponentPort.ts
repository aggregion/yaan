import { PlantUmlObject } from './plantUmlObject';
import {
    SolutionPort,
    SolutionPortDetailed,
} from '../../yaan/schemas/solution';
import { escapeStr } from './helpers';

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
        Deployment_Node("${this.id}", "${escapeStr(
            this.portName || port.description || '',
        )}", "Port", "${escapeStr(port.description || '')}") {
        `;
    }

    protected get footer(): string {
        return `
        }`;
    }
}
