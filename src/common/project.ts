import { EntityType, EntityTypeBinding } from './schemas/configContainer';
import { ProjectContainer } from './types';

export class Project implements ProjectContainer {
    private readonly data = new Map();

    set<T extends EntityType>(
        type: T,
        name: string,
        value: EntityTypeBinding[T],
    ) {
        let entityTypeMap = this.data.get(type);
        if (!entityTypeMap) {
            const map = new Map<string, EntityTypeBinding[EntityType]>();
            this.data.set(type, map);
            entityTypeMap = map;
        }
        entityTypeMap.set(name, value);
    }

    get<T extends EntityType>(
        type: T,
        name: string,
    ): EntityTypeBinding[T] | undefined {
        const map = this.data.get(type);
        if (!map) {
            return;
        }
        return map.get(name);
    }
}
