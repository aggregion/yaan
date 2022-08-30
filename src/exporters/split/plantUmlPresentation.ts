import { PlantUmlObject } from './plantUmlObject';
import { Presentation } from '../../yaan/schemas/presentation';

export class PlantUmlPresentation extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly presentation: Presentation,
    ) {
        super(id);
    }

    protected get header(): string {
        return `Deployment_Node("${this.id}", "${this.presentation.title}", ""){`;
    }

    protected get footer(): string {
        return '}';
    }
}
