import path from 'path';
import glob from 'glob';
import { Parser } from '../src/common/types';

export const runTestCases = (
    validFilesGlob: string,
    invalidFilesGlob: string,
    parser: Parser,
) => {
    const validFiles = glob.sync(
        path.join(__dirname, 'testdata', validFilesGlob),
    );

    const invalidFiles = glob.sync(
        path.join(__dirname, 'testdata', invalidFilesGlob),
    );

    test('should accept valid files', () => {
        for (const file of validFiles) {
            expect(
                () => parser.parseFiles([file]),
                `File: ${file}`,
            ).not.toThrow();
        }
    });

    test('should not accept invalid files', () => {
        for (const file of invalidFiles) {
            expect(() => parser.parseFiles([file]), `File: ${file}`).toThrow();
        }
    });
};
