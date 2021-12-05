import { EntityType, EntityTypeBinding } from './schemas/configContainer';

export interface ProjectContainer {
    set<T extends EntityType>(
        type: T,
        name: string,
        value: EntityTypeBinding[T],
    ): void;

    get<T extends EntityType>(
        type: T,
        name: string,
    ): EntityTypeBinding[T] | undefined;
}

export interface Parser {
    parse(data: (string | Buffer)[]): ProjectContainer;
    parseFiles(files: string[]): ProjectContainer;
}
