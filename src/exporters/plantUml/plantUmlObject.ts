export abstract class PlantUmlObject {
    public readonly children: PlantUmlObject[] = [];

    constructor(public readonly id: string) {}

    protected abstract get header(): string;

    protected abstract get footer(): string;

    public print() {
        return `
        ${this.header}
        ${this.children.map((c) => c.print()).join('\n')}
        ${this.footer}
        `;
    }
}
