import { YamlParser } from '../src/parsers/yamlParser';
import { runTestCases } from './testCases';

describe('YamlParser', () => {
    describe('parse', () => {
        const parser = new YamlParser();
        runTestCases('valid-configs/*.yaml', 'invalid-configs/*.yaml', parser);
    });
});
