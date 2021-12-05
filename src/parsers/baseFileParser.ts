import { Parser, Project } from '../common/types';
import fs from 'fs';
import path from 'path';
import { ConfigContainer } from '../common/schemas/configContainer';
import Ajv from 'ajv';
import YAML from 'yaml';

export abstract class BaseFileParser implements Parser {
    protected readonly jsonSchema: any;

    constructor() {
        this.jsonSchema = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../../schema.json'), 'utf8'),
        );
    }

    protected abstract parseData(data: Buffer | string): any;

    parse(data: (string | Buffer)[], names: string[] = []): Project {
        const kindMap: any = {
            Solution: 'solutions',
        };
        const project: Project = {
            solutions: [],
        };
        for (let i = 0; i < data.length; i++) {
            const configData = data[i];
            const container = this.parseData(configData) as ConfigContainer;
            const ajv = new Ajv();
            ajv.addSchema(this.jsonSchema);
            const validate = ajv.getSchema('#/definitions/ConfigContainer');
            if (!validate) {
                throw new Error(
                    `Can't find definition of ConfigContainer in schema`,
                );
            }
            const valid = validate(container);
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
                        names[i] ? ` for "${names[i]}"` : ''
                    }:\n${errorsPrettified}`,
                );
            }
            const kindProp = kindMap[container.kind];
            if (!project.hasOwnProperty(kindProp)) {
                throw new Error(`Unknown kind: ${container.kind}`);
            }
            (project as any)[kindMap[container.kind]].push(container.spec);
        }
        return project;
    }

    parseFiles(files: string[]): Project {
        return this.parse(
            files.map((fileName) => fs.readFileSync(fileName, 'utf8')),
            files,
        );
    }
}
