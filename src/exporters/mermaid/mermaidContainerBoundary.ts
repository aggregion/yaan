import { MermaidBoundary } from './mermaidBoundary';

export class MermaidContainerBoundary extends MermaidBoundary {
    protected get boundaryType() {
        return 'Container_';
    }
}
