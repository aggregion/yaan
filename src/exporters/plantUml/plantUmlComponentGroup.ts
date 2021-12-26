import { PlantUmlObject } from './plantUmlObject';
import { SolutionComponentGroup } from '../../yaan/schemas/solution';

export class PlantUmlComponentGroup extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly group: SolutionComponentGroup,
    ) {
        super(id);
    }

    protected get header(): string {
        return `
        Deployment_Node("${this.id}", "${
            this.group.title || ''
        }", "Group", "", "") {
        `;
    }

    protected get footer(): string {
        return `
        }`;
    }
}
