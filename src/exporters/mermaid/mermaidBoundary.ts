import { MermaidObject } from './mermaidObject';

export class MermaidBoundary extends MermaidObject {
    constructor(public readonly id: string, public readonly title?: string) {
        super(id);
    }

    public transparent = false;

    protected get footer(): string {
        let str = '}';
        if (this.transparent) {
            str += `\nUpdateElementStyle(${this.id}, $borderColor="transparent")`;
        }
        return str;
    }

    protected get header(): string {
        return `${this.boundaryType}Boundary(${this.id}, "${this.title || ''}"${
            this.boundaryType === '' ? ', ""' : ''
        }) {`;
    }

    protected get boundaryType() {
        return '';
    }
}
