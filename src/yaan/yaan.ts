import { Parser, ProjectContainer } from './types';
import { Project } from './project';
import * as glob from 'glob';
import * as path from 'path';
import { YamlParser } from '../parsers/yamlParser';

export interface YAANOptions {
    parser?: Parser;
}

export class YAAN {
    private readonly parser: Parser;

    constructor(options: YAANOptions = {}) {
        this.parser = options.parser || new YamlParser();
    }

    createProject(): ProjectContainer {
        return new Project();
    }

    loadProjectFromDir(
        dir: string,
        project?: ProjectContainer,
    ): ProjectContainer {
        const files = glob.sync(path.join(dir, '**/*.yaml'));
        return this.parser.parseFiles(files, project);
    }
}
