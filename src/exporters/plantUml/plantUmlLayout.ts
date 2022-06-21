import { PlantUmlObject } from './plantUmlObject';

export enum LayoutDirection {
    Up = 'U',
    Down = 'D',
    Right = 'R',
    Left = 'L',
}

export class PlantUmlLayout extends PlantUmlObject {
    constructor(
        public readonly fromKey: string,
        public readonly toKey: string,
        public readonly direction: LayoutDirection,
    ) {
        super('');
    }

    protected get header(): string {
        return `
        Lay${'_' + this.direction}("${this.fromKey}", "${this.toKey}")
        `;
    }

    protected get footer(): string {
        return '';
    }
}
