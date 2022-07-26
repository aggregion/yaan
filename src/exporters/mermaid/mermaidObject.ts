export abstract class MermaidObject {
    public readonly children: MermaidObject[] = [];

    constructor(public readonly id?: string) {}

    protected abstract get header(): string;

    protected abstract get footer(): string;

    public print(): string {
        return `${this.header}\n${this.children
            .map((c) => c.print())
            .join('\n')}\n${this.footer}`;
    }
}
