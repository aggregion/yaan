import { Command, flags } from '@oclif/command';
import { C4Docs } from '../../exporters/c4/c4';
import { YAAN } from '../../yaan/yaan';

export default class C4Plantuml extends Command {
    static description = 'Export to C4 PlantUML';

    static examples = [
        `$ yaan export c4 -p presentation path-to-my-yaan-project path-to-result-directory`,
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
            const { args, flags } = this.parse(C4Plantuml);
            if (args.projectPath && args.resultPath) {
                const yaan = new YAAN();
                const project = yaan.loadProjectFromDir(args.projectPath);
                const c4 = new C4Docs(project, flags.presentation);

                await c4.print(args.resultPath);
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
