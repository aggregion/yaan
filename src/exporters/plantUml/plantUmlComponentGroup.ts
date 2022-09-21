import { SolutionComponentGroup } from '../../yaan/schemas/solution';
import { GroupVisibility, PlantUmlGroup } from './plantUmlGroup';

export class PlantUmlComponentGroup extends PlantUmlGroup {
    constructor(
        public readonly id: string,
        public readonly group: SolutionComponentGroup,
    ) {
        super(id, GroupVisibility.HiddenIfEmpty, group.title);
    }

    protected get header(): string {
        return '';
    }

    protected get footer(): string {
        return '';
    }
}
