import { PlantUmlObject } from './plantUmlObject';

export class PlantUmlRelation extends PlantUmlObject {
    constructor(
        public readonly fromKey: string,
        public readonly toKey: string,
        public readonly type: string,
        public readonly title?: string,
    ) {
        super('');
    }

    protected get header(): string {
        return `
        Rel("${this.fromKey}", "${this.toKey}", "${
            this.title || ' '
        }", $tags="${this.type}")
        `;
    }

    protected get footer(): string {
        return '';
    }
}
