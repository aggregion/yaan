export interface Printable {
    print(): string;
}

export abstract class PrintableObject implements Printable {
    public objectName = 'PrintableObject';

    public readonly children: PrintableObject[] = [];

    constructor(public readonly id: string) {}

    public print(): string {
        return this.children.map((c) => c.print()).join('\n');
    }

    public get uniqId(): string {
        return `${this.objectName}/${this.id}`;
    }
}
