import { Parser, ProjectContainer } from '../common/types';
import fs from 'fs';
import path from 'path';
import { ConfigContainer } from '../common/schemas/configContainer';
import Ajv from 'ajv';
import YAML from 'yaml';
import { Project } from '../common/project';

export abstract class BaseFileParser implements Parser {
    protected readonly jsonSchema: any;
    private readonly ajv = new Ajv();

    constructor() {
        this.jsonSchema = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../../schema.json'), 'utf8'),
        );
        this.ajv.addSchema(this.jsonSchema);
    }

    protected abstract parseData(data: Buffer | string): any;

    private validateSchema(data: any, entityName: string, fileName: string) {
        const validate = this.ajv.getSchema(`#/definitions/${entityName}`);
        if (!validate) {
            throw new Error(`Can't find definition of ${entityName} in schema`);
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

    parse(data: (string | Buffer)[], names: string[] = []): ProjectContainer {
        const project = new Project();
        for (let i = 0; i < data.length; i++) {
            const configData = data[i];
            const container = this.parseData(configData) as ConfigContainer;

            this.validateSchema(
                container,
                'CommonConfigContainerAttributes',
                names[i],
            );

            this.validateSchema(container.spec, container.kind, names[i]);

            project.set(
                container.kind,
                container.metadata.name,
                container.spec,
            );
        }
        return project;
    }

    parseFiles(files: string[]): ProjectContainer {
        return this.parse(
            files.map((fileName) => fs.readFileSync(fileName, 'utf8')),
            files,
        );
    }
}
