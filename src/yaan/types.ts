import { EntityTypeBinding } from './schemas/configContainer';

type ProjectDataMap<T> = {
    readonly [Property in keyof T as `${Uncapitalize<
        string & Property
    >}s`]: Map<string, T[Property]>;
};

export type ProjectContainer = ProjectDataMap<EntityTypeBinding>;
export interface Parser {
    parse(
        data: (string | Buffer)[],
        project?: ProjectContainer,
    ): ProjectContainer;
    parseFiles(files: string[], project?: ProjectContainer): ProjectContainer;
}
