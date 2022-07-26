import { MermaidComponent } from './mermaidComponent';

export class MermaidComponentQueue extends MermaidComponent {
    protected get containerType() {
        return 'Queue';
    }
}
