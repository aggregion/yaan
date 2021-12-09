import { Command } from '@oclif/command';

export default class CodesCommands extends Command {
    static description = 'Export YAAN project to some representation format';

    run(): PromiseLike<any> {
        return Promise.resolve();
    }
}
