import { Command, flags } from '@oclif/command';
import { PlantUml } from '../../exporters/plantUml/plantUml';
import { YAAN } from '../../yaan/yaan';

export default class Plantuml extends Command {
    static description = 'Export to PlantUML';

    static examples = [
        `$ yaan export plantuml -p prod ./my-yaan-project > prod.plantuml`,
    ];

    static flags = {
        help: flags.help({ char: 'h' }),
        // flag with no value (-f, --force)
        presentation: flags.string({
            char: 'p',
            description: 'name of project presentation to export',
            required: true,
        }),
    };

    static args = [{ name: 'dir' }];

    async run() {
        try {
            const { args, flags } = this.parse(Plantuml);

            if (args.dir) {
                const yaan = new YAAN();
                const project = yaan.loadProjectFromDir(args.dir);
                const plantUml = new PlantUml(project, flags.presentation);
                this.log(plantUml.print());
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
