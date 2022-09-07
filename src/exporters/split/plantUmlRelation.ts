import { PlantUmlObject } from './plantUmlObject';

export enum RelationDirection {
    None = '',
    Up = 'U',
    Down = 'D',
    Right = 'R',
    Left = 'L',
}

export class PlantUmlRelation extends PlantUmlObject {
    constructor(
        public readonly fromKey: string,
        public readonly toKey: string,
        public readonly type: string,
        public readonly direction: RelationDirection = RelationDirection.None,
        public readonly title?: string,
    ) {
        super('');
    }

    protected get header(): string {
        return `
        Rel${this.direction ? '_' + this.direction : ''}("${this.fromKey}", "${
            this.toKey
        }", "${this.title || ' '}", $tags="${this.type}")
        `;
    }

    protected get footer(): string {
        return '';
    }

    public getParams() {
        return {
            fromKey: this.fromKey,
            toKey: this.toKey,
            type: this.type,
            direction: this.direction,
            title: this.title,
        };
    }
}
