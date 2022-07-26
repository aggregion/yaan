import { MermaidContainer } from './mermaidContainer';

export class MermaidContainerDb extends MermaidContainer {
    protected get containerType() {
        return 'Db';
    }
}
