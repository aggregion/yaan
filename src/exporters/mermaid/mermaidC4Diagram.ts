import { MermaidObject } from './mermaidObject';

export class MermaidC4Diagram extends MermaidObject {
    constructor(public readonly title?: string) {
        super();
    }

    protected get footer(): string {
        return '';
    }

    protected get header(): string {
        let str = 'C4Component';
        if (this.title) {
            str += `\ntitle ${this.title}`;
        }
        return str;
    }
}
