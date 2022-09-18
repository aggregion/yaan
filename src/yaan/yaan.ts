import { Parser, ProjectContainer } from './types';
import { Project } from './project';
import * as glob from 'glob';
import * as path from 'path';
import { YamlParser } from '../parsers/yamlParser';
import * as child_process from 'child_process';
import * as YAML from 'yaml';

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
        kuztomize = false,
    ): ProjectContainer {
        if (!kuztomize) {
            const files = glob.sync(path.join(dir, '**/*.yaml'));
            return this.parser.parseFiles(files, project);
        } else {
            try {
                child_process.execSync('kustomize version');
            } catch (e) {
                throw new Error(`Kustomize must be installed: ${e}`);
            }
            const projectData = child_process
                .execSync(`kustomize build '${dir}'`)
                .toString('utf8');
            const projectDocs = YAML.parseAllDocuments(projectData).map((d) =>
                YAML.stringify(d),
            );
            return this.parser.parse(projectDocs);
        }
    }
}
