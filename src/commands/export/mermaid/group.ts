import { Command, flags } from '@oclif/command';
import { YAAN } from '../../../yaan/yaan';
import { MermaidExporter } from '../../../exporters/mermaid/mermaid';

export default class ExportMermaidGroup extends Command {
    static description = 'Export to MermaidJS diagram';

    static examples = [
        `$ yaan export:mermaid:group -s my_awesome_solution -n group ./my-yaan-project > my_awesome_component.mermaid`,
    ];

    static flags = {
        help: flags.help({ char: 'h' }),
        kustomize: flags.boolean({
            char: 'k',
            description: 'Target directory is Kustomize',
        }),
        solution: flags.string({
            char: 's',
            description: 'solution containing component to export',
            required: true,
        }),
        name: flags.string({
            char: 'n',
            description: 'name of group to export',
            required: true,
        }),
    };

    static args = [{ name: 'dir' }];

    async run() {
        try {
            const { args, flags } = this.parse(ExportMermaidGroup);

            if (args.dir) {
                const yaan = new YAAN();
                const project = yaan.loadProjectFromDir(
                    args.dir,
                    undefined,
                    flags.kustomize,
                );
                const mermaid = new MermaidExporter(project);
                this.log(mermaid.exportGroup(flags.solution, flags.name));
            } else {
                this.error('Please specify project directory');
                return -1;
            }
        } catch (e) {
            console.error(e);
            this.error(e as Error);
        }
    }
}
