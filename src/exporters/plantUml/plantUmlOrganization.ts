import { PlantUmlObject } from './plantUmlObject';
import { Organization } from '../../yaan/schemas/organization';
import { escapeStr } from './helpers';

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
                `AddProperty("Description", "${escapeStr(
                    this.organization.description,
                )}")`,
            );
        }
        return props.join('\n');
    }

    protected get header(): string {
        return `
        ${this.renderProps()}
        Boundary("${this.id}", "${escapeStr(
            this.organization.title,
        )}", "Organization", "", $tags="organization"){
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
