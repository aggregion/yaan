import { Command, flags } from '@oclif/command';
import { SplitDocs } from '../../exporters/split/splitUml';
import { YAAN } from '../../yaan/yaan';

export default class SplitPlantuml extends Command {
    static description = 'Export to PlantUMLs splitted by components';

    static examples = [
        `$ yaan export split -p presentation path-to-my-yaan-project path-to-result-directory`,
    ];

    static flags = {
        help: flags.help({ char: 'h' }),
        presentation: flags.string({
            char: 'p',
            description: 'path to relative project presentation to export',
            required: true,
        }),
    };

    static args = [{ name: 'projectPath' }, { name: 'resultPath' }];

    async run() {
        try {
            const { args, flags } = this.parse(SplitPlantuml);
            if (args.projectPath && args.resultPath) {
                const yaan = new YAAN();
                const project = yaan.loadProjectFromDir(args.projectPath);
                const split = new SplitDocs(project, flags.presentation);

                await split.print(args.resultPath);
            } else {
                this.error(
                    'Please specify path to project directory and path to write result',
                );
                return -1;
            }
        } catch (e) {
            console.error(e);
            this.error(e as Error);
        }
    }
}
