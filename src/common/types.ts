import { Solution } from './schemas/solution';

export interface Project {
    solutions: Solution[];
}

export interface Parser {
    parse(data: (string | Buffer)[]): Project;
    parseFiles(files: string[]): Project;
}
