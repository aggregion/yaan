import { PlantUmlObject } from './plantUmlObject';
import { Organization } from '../../yaan/schemas/organization';

export class PlantUmlOrganization extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly organization: Organization,
    ) {
        super(id);
    }

    private renderProps(): string {
        const props = [];
        if (this.organization.description) {
            props.push(
                `AddProperty("Description", "${this.organization.description}")`,
            );
        }
        return props.join('\n');
    }

    protected get header(): string {
        return `
        ${this.renderProps()}
        Deployment_Node("${this.id}", "${
            this.organization.title
        }", "Organization", "", $tags="organization"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
