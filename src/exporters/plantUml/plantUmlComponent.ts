import { PlantUmlObject } from './plantUmlObject';
import { SolutionComponent } from '../../yaan/schemas/solution';
import { escapeStr } from './helpers';
import { icons } from './icons';

export class PlantUmlComponent extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly component: SolutionComponent,
        public readonly namespace?: string,
    ) {
        super(id);
    }

    private getContainerIcon() {
        if (this.component.technology) {
            const iconName = `cloudinsight/${this.component.technology.toLowerCase()}`;
            return icons[iconName];
        }
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
        const icon = this.getContainerIcon();
        const spriteStr = icon ? `, $sprite="${icon.name}"` : '';
        return `
        ${this.getContainerFigure()}("${this.id}", "${escapeStr(
            this.component.title || '',
        )}", "${escapeStr(
            this.namespace ? `Namespace: ${this.namespace}` : '-',
        )}", "${escapeStr(
            this.component.description || 'Component',
        )}", "" ${spriteStr}) {
        `;
    }

    protected get footer(): string {
        return `
        }`;
    }

    protected get includes(): Set<string> {
        const icon = this.getContainerIcon();
        return icon ? new Set([icon.include]) : new Set();
    }
}
