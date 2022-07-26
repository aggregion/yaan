import { MermaidObject } from './mermaidObject';

export class MermaidNothing extends MermaidObject {
    protected get footer(): string {
        return '';
    }

    protected get header(): string {
        return '';
    }
}
