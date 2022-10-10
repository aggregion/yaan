export abstract class PlantUmlObject {
    public readonly children: PlantUmlObject[] = [];

    constructor(public readonly id: string) {}

    protected abstract get header(): string;

    protected abstract get footer(): string;

    public print(): string {
        return `
        ${this.header}
        ${this.children.map((c) => c.print()).join('\n')}
        ${this.footer}
        `;
    }

    public printIncludes(): string {
        return `${Array.from(this.includes)
            .map(PlantUmlObject.formatInclude)
            .filter((inc) => inc)
            .join('\n')}
            ${this.children
                .map((c) => c.printIncludes())
                .filter((inc) => inc)
                .join('\n')}
            `;
    }

    protected get includes(): Set<string> {
        return new Set();
    }

    private static formatInclude(include: string) {
        return `!include ${include}`;
    }
}
