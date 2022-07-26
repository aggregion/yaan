import { MermaidObject } from './mermaidObject';

export interface MermaidComponentOptions {
    link?: string;
}

export class MermaidComponent extends MermaidObject {
    public ext = false;

    constructor(
        public readonly id: string,
        public readonly title?: string,
        public readonly technology?: string,
        public readonly description?: string,
        public readonly options?: MermaidComponentOptions,
    ) {
        super(id);
    }

    public print(): string {
        return `Component${this.containerType}${this.ext ? '_Ext' : ''}(${
            this.id
        }, "${this.title || ''}", "${this.technology || ''}", "${
            this.description || ''
        }"${this.options?.link ? `, $link="${this.options.link}"` : ''})`;
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
