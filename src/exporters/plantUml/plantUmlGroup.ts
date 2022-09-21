import { PlantUmlObject } from './plantUmlObject';
import { escapeStr } from './helpers';

export enum GroupVisibility {
    Hidden,
    HiddenIfEmpty,
    Visible,
}

export class PlantUmlGroup extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly visibility: GroupVisibility = GroupVisibility.Hidden,
        public readonly title?: string,
        public readonly tags?: string[],
    ) {
        super(id);
    }

    protected get header(): string {
        const hidden =
            this.visibility === GroupVisibility.Hidden ||
            (this.visibility === GroupVisibility.HiddenIfEmpty &&
                this.children.length === 0);

        return `
        Boundary("${this.id || 'unknown'}", "${
            (!hidden && escapeStr(this.title || '')) || ' '
        }", $tags="${this.tags ? this.tags.join('+') + '+' : ''}${
            hidden ? 'hiddenGroup' : 'visibleGroup'
        }"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
