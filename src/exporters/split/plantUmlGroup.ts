import { PlantUmlObject } from './plantUmlObject';

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
        const hidden = this.visibility === GroupVisibility.Hidden;

        return `
        Deployment_Node("${this.id || 'unknown'}", "${
            (!hidden && this.title) || ' '
        }", $tags="${this.tags ? this.tags.join('+') + '+' : ''}${
            hidden ? 'hiddenGroup' : 'visibleGroup'
        }"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
