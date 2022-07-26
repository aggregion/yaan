import { MermaidContainer } from './mermaidContainer';

export class MermaidContainerQueue extends MermaidContainer {
    protected get containerType() {
        return 'Queue';
    }
}
