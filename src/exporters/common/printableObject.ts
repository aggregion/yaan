export interface Printable {
    print(): string;
}

export abstract class PrintableObject implements Printable {
    public objectName = 'PrintableObject';

    public readonly children: PrintableObject[] = [];

    constructor(public readonly id: string) {}

    public print(level = 0): string {
        return this.children
            .map((c) => c.print(level + 1))
            .map((s) => '  '.repeat(level) + s)
            .join('\n');
    }
}
