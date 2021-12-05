import path from 'path';
import { YamlParser } from '../src/parsers/yamlParser';
import { runTestCases } from './testCases';

const testData: Record<string, string> = {};

['solution1', 'solution1_inv_kind', 'solution1_inv_volume'].forEach(
    (name) =>
        (testData[name] = path.join(__dirname, 'testdata', name + '.yaml')),
);

describe('YamlParser', () => {
    describe('parse', () => {
        const parser = new YamlParser();
        runTestCases(parser);
    });
});
