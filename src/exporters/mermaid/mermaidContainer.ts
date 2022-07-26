import { MermaidObject } from './mermaidObject';

export class MermaidContainer extends MermaidObject {
    constructor(
        public readonly id: string,
        public readonly title?: string,
        public readonly technology?: string,
        public readonly description?: string,
    ) {
        super(id);
    }

    public print(): string {
        return `Container${this.containerType}(${this.id}, "${
            this.title || ''
        }", "${this.technology || ''}", "${this.description || ''}")`;
    }

    protected get containerType() {
        return '';
    }

    protected get footer(): string {
        return '';
    }

    protected get header(): string {
        return '';
    }
}
