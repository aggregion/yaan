import { MermaidComponent } from './mermaidComponent';

export class MermaidComponentDb extends MermaidComponent {
    protected get containerType() {
        return 'Db';
    }
}
