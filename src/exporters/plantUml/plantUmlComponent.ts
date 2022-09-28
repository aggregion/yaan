import { PlantUmlObject } from './plantUmlObject';
import { SolutionComponent } from '../../yaan/schemas/solution';
import { escapeStr } from './helpers';

export class PlantUmlComponent extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly component: SolutionComponent,
        public readonly namespace?: string,
    ) {
        super(id);
    }

    private getContainerFigure() {
        switch (this.component.kind) {
            case 'db':
                return 'ContainerDb';
            case 'queue':
                return 'ContainerQueue';
            default:
                return 'Container';
        }
    }

    protected get header(): string {
        return `
        ${this.getContainerFigure()}("${this.id}", "${escapeStr(
            this.component.title || '',
        )}", "${escapeStr(
            this.namespace ? `Namespace: ${this.namespace}` : '-',
        )}", "${escapeStr(this.component.description || 'Component')}", "") {
        `;
    }

    protected get footer(): string {
        return `
        }`;
    }
}
