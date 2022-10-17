import { PlantUmlObject } from './plantUmlObject';
import { escapeStr } from './helpers';
import * as crypto from 'crypto';

export enum RelationDirection {
    None = '',
    Up = 'U',
    Down = 'D',
    Right = 'R',
    Left = 'L',
    Neighbor = 'Neighbor',
}

const getUniqueColor = (n: number) => {
    const rgb = [0, 0, 0];

    for (let i = 0; i < 24; i++) {
        rgb[i % 3] <<= 1;
        rgb[i % 3] |= n & 0x01;
        n >>= 1;
    }

    return (
        '#' +
        rgb.reduce(
            (a, c) => (c > 0x0f ? c.toString(16) : '0' + c.toString(16)) + a,
            '',
        )
    );
};

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
        const md5 = crypto.createHash('md5');
        md5.update(this.fromKey + '$' + this.toKey);
        const hash = md5.digest('hex');
        const color = getUniqueColor(parseInt(hash.slice(0, 4), 16));
        return `
        AddRelTag("${
            this.fromKey
        }", $textColor="${color}", $lineColor="${color}")
        Rel${this.direction ? '_' + this.direction : ''}("${this.fromKey}", "${
            this.toKey
        }", "${escapeStr(this.title || ' ')}", $tags="${this.fromKey}+${
            this.type
        }")
        `;
    }

    protected get footer(): string {
        return '';
    }
}
