import { PlantUmlObject } from './plantUmlObject';
import { escapeStr } from './helpers';

export enum RelationDirection {
    None = '',
    Up = 'U',
    Down = 'D',
    Right = 'R',
    Left = 'L',
    Neighbor = 'Neighbor',
}

const contrastColors = [
    '#20A811',
    '#2F18F5',
    '#1BF501',
    '#F57018',
    '#A84300',

    '#A8A411',
    '#00A1F5',
    '#F5EE00',
    '#F51828',
    '#A8000C',

    '#A88111',
    '#01F5B3',
    '#F5B600',
    '#DC18F5',
    '#9600A8',

    '#3941A8',
    '#F5956C',
    '#6D76F5',
    '#87F553',
    '#9FAB9A',
];

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
        const color =
            contrastColors[Math.trunc(Math.random() * contrastColors.length)];
        return `
        Rel${this.direction ? '_' + this.direction : ''}("${this.fromKey}", "${
            this.toKey
        }", "${escapeStr(this.title || ' ')}", $tags="${this.fromKey}+${
            this.type
        }")
        AddRelTag("${
            this.fromKey
        }", $textColor="${color}", $lineColor="${color}")
        `;
    }

    protected get footer(): string {
        return '';
    }
}
