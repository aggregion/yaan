import * as YAML from 'yaml';
import { BaseFileParser } from './baseFileParser';

export class YamlParser extends BaseFileParser {
    protected parseData(data: string | Buffer): any {
        const dataStr = Buffer.isBuffer(data)
            ? data.toString('utf8')
            : (data as string);
        return YAML.parse(dataStr);
    }
}
