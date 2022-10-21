import { PlantUmlObject } from './plantUmlObject';
import { Presentation } from '../../yaan/schemas/presentation';
import { escapeStr } from './helpers';

export class PlantUmlPresentation extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly presentation: Presentation,
    ) {
        super(id);
    }

    protected get header(): string {
        return `Deployment_Node("${this.id}", "${escapeStr(
            this.presentation.title,
        )}", "", $tags="presentation"){`;
    }

    protected get footer(): string {
        return '}';
    }
}
