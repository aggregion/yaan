import { Command, flags } from '@oclif/command';
import { YAAN } from '../../../yaan/yaan';
import { MermaidExporter } from '../../../exporters/mermaid/mermaid';

export default class ExportMermaidSolution extends Command {
    static description = 'Export to MermaidJS diagram';

    static examples = [
        `$ yaan export:mermaid:solution -n my_awesome_solution ./my-yaan-project > my_awesome_solution.mermaid`,
    ];

    static flags = {
        help: flags.help({ char: 'h' }),
        kustomize: flags.boolean({
            char: 'k',
            description: 'Target directory is Kustomize',
        }),
        solution: flags.string({
            char: 's',
            description: 'name of solution to export',
            required: true,
        }),
        detailed: flags.boolean({
            char: 'd',
            description: 'use components instead of groups',
            required: false,
            default: false,
        }),
    };

    static args = [{ name: 'dir' }];

    async run() {
        try {
            const { args, flags } = this.parse(ExportMermaidSolution);

            if (args.dir) {
                const yaan = new YAAN();
                const project = yaan.loadProjectFromDir(
                    args.dir,
                    undefined,
                    flags.kustomize,
                );
                const mermaid = new MermaidExporter(project);
                if (flags.detailed) {
                    this.log(mermaid.exportSolutionDetailed(flags.solution));
                } else {
                    this.log(mermaid.exportSolution(flags.solution));
                }
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
