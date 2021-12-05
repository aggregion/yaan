import path from 'path';
import { Parser } from '../src/common/types';

const testData: Record<string, string> = {};

[
    'valid-deployment/solution-myapp',
    'solution1_inv_kind',
    'solution1_inv_volume',
].forEach(
    (name) =>
        (testData[name] = path.join(__dirname, 'testdata', name + '.yaml')),
);

export const runTestCases = (parser: Parser) => {
    it('should validate schema', () => {
        expect(() =>
            parser.parseFiles([testData['valid-deployment/solution-myapp']]),
        ).not.toThrow();
        expect(() =>
            parser.parseFiles([testData['solution1_inv_kind']]),
        ).toThrow();
        expect(() =>
            parser.parseFiles([testData['solution1_inv_volume']]),
        ).toThrow();
    });
};
