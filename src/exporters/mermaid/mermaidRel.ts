import { MermaidObject } from './mermaidObject';

export class MermaidRel extends MermaidObject {
    constructor(
        public readonly from: string,
        public readonly to: string,
        public readonly title?: string,
        public readonly technology?: string,
        public readonly description?: string,
        public readonly port?: string,
    ) {
        super();
    }

    public print(): string {
        const proto =
            this.technology && this.port
                ? `${this.technology} (${this.port})`
                : this.technology
                ? `${this.technology}`
                : this.port
                ? `${this.port}`
                : '';
        return `Rel${this.relationType}(${this.from}, ${this.to}, "${
            this.title || ''
        }", "${proto}", "${this.description || ''}")`;
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
