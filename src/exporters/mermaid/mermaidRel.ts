import { MermaidObject } from './mermaidObject';

export class MermaidRel extends MermaidObject {
    constructor(
        public readonly from: string,
        public readonly to: string,
        public readonly title?: string,
        public readonly technology?: string,
        public readonly description?: string,
    ) {
        super();
    }

    public print(): string {
        return `Rel${this.relationType}(${this.from}, ${this.to}, "${
            this.title || ''
        }", "${this.technology || ''}", "${this.description || ''}")`;
    }

    protected get relationType() {
        return '';
    }

    protected get footer(): string {
        return '';
    }

    protected get header(): string {
        return '';
    }
}
