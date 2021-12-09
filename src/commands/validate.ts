import { Command, flags } from '@oclif/command';
import { YAAN } from '../yaan/yaan';
import * as YAML from 'yaml';

export default class Validate extends Command {
    static description = 'validate project';

    static examples = [
        `$ yaan validate ./my-yaan-project
Project is valid!
`,
    ];

    static flags = {
        help: flags.help({ char: 'h' }),
        // flag with no value (-f, --force)
        silent: flags.boolean({
            char: 's',
            description: 'do not print messages if project is valid',
        }),
    };

    static args = [{ name: 'dir' }];

    async run() {
        try {
            const { args, flags } = this.parse(Validate);

            if (args.dir) {
                const yaan = new YAAN();
                const project = yaan.loadProjectFromDir(args.dir);
                if (!flags.silent) {
                    this.log('Project is valid!');
                    const obj: any = {};
                    [
                        'deployments',
                        'kubernetesClusters',
                        'presentations',
                        'providers',
                        'servers',
                        'solutions',
                    ].forEach(
                        (prop) => (obj[prop] = (project as any)[prop].keys()),
                    );
                    this.log(YAML.stringify(obj));
                }
            } else {
                this.error('Please specify project directory');
                return -1;
            }
        } catch (e) {
            this.error(e as Error);
        }
    }
}
