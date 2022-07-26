import { Command, flags } from '@oclif/command';
import { YAAN } from '../../../yaan/yaan';
import { MermaidExporter } from '../../../exporters/mermaid/mermaid';
import * as fs from 'fs';

export default class ExportMermaidComponents extends Command {
    static description = 'Export to MermaidJS diagram';

    static examples = [
        `$ yaan export:mermaid:components -s my_awesome_solution ./my-yaan-project > my_awesome_component.mermaid`,
    ];

    static flags = {
        help: flags.help({ char: 'h' }),
        solution: flags.string({
            char: 's',
            description: 'solution containing component to export',
            required: true,
        }),
    };

    static args = [{ name: 'dir' }];

    async run() {
        try {
            const { args, flags } = this.parse(ExportMermaidComponents);

            if (args.dir) {
                const yaan = new YAAN();
                const project = yaan.loadProjectFromDir(args.dir);
                const mermaid = new MermaidExporter(project);
                const sol = project.solutions.get(flags.solution);
                if (!sol) {
                    throw new Error(`Invalid solution name: ${flags.solution}`);
                }
                for (const compName of Object.keys(sol.components)) {
                    const mmd = mermaid.exportComponentWithRelations(
                        flags.solution,
                        compName,
                        { useBoundary: false, generateLinks: true },
                    );
                    fs.writeFileSync(`${compName}.mermaid`, mmd, 'utf-8');
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
