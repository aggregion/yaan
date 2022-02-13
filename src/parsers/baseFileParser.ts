import { Parser, ProjectContainer } from '../yaan/types';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigContainer } from '../yaan/schemas/configContainer';
import * as YAML from 'yaml';
import { Project } from '../yaan/project';
import Ajv from 'ajv';

const unCapitalize = (string: string) => {
    return string.charAt(0).toLocaleLowerCase() + string.slice(1);
};

export abstract class BaseFileParser implements Parser {
    protected readonly jsonSchema: any;
    private readonly ajv = new Ajv();

    constructor() {
        this.jsonSchema = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../../schema.json'), 'utf8'),
        );
        this.ajv.addSchema(this.jsonSchema, 'default');
    }

    protected abstract parseData(data: Buffer | string): any;

    private validateSchema(data: any, fileName: string, keyRef = 'default') {
        const validate = this.ajv.getSchema(keyRef);
        if (!validate) {
            throw new Error(`Can't find definition of ${keyRef} in schema`);
        }
        const valid = validate(data);
        if (!valid) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const errorsPrettified = validate
                .errors!.map(
                    (e, i) =>
                        `Error #${i + 1}:\n${YAML.stringify(e)
                            .split('\n')
                            .map((s) => '  ' + s)
                            .join('\n')}`,
                )
                .join('\n');
            throw new Error(
                `Schema validation error${
                    fileName ? ` for "${fileName}"` : ''
                }:\n${errorsPrettified}`,
            );
        }
    }

    parse(
        data: (string | Buffer)[],
        project?: ProjectContainer,
        names: string[] = [],
    ): ProjectContainer {
        if (!project) {
            project = new Project();
        }
        for (let i = 0; i < data.length; i++) {
            const configData = data[i];
            const container = this.parseData(configData) as ConfigContainer;

            this.validateSchema(container, names[i]);

            (project as any)[`${unCapitalize(container.kind)}s`].set(
                container.metadata.name,
                container.spec,
            );
        }
        return project;
    }

    parseFiles(files: string[], project?: ProjectContainer): ProjectContainer {
        return this.parse(
            files.map((fileName) => fs.readFileSync(fileName, 'utf8')),
            project,
            files,
        );
    }
}
