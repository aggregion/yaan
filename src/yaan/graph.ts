import * as objectPath from 'object-path';
import * as crypto from 'crypto';

type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type RecordElement<RecordType extends Record<string, unknown>> =
    RecordType extends Record<string, infer ElementType> ? ElementType : never;

type ArrayElementOrUnknown<T> = T extends readonly unknown[]
    ? ArrayElement<T>
    : unknown;

type Defined<T> = Exclude<T, undefined>;

type MappedObject<T> = {
    [Property in keyof T]: T[Property][];
};

type MappedArrayObject<T extends []> = {
    [Property in keyof ArrayElement<T>]: ArrayElement<T>[Property][];
};

type EachFunction<T> = T extends Record<string, infer ElementType>
    ? (v: GraphNode<ElementType>, key: string) => void
    : T extends readonly (infer ElementType)[]
    ? (v: GraphNode<ElementType>, key: number) => void
    : never;

export class GraphNode<T> {
    constructor(
        private readonly baseObject: object,
        private readonly path: string[],
    ) {}

    get<K extends keyof T>(name: K) {
        return new GraphNode<Defined<T[K]>>(this.baseObject, [
            ...this.path,
            String(name),
        ]);
    }

    map(filter: (key: string) => boolean = () => true) {
        const path = [...this.path];
        const val = objectPath.get(this.baseObject, path);
        const arr = Object.entries(val).filter((kv) => filter(kv[0])) as any;
        const result: any = {};
        for (const [, item] of arr) {
            for (const key in item) {
                if (!result[key]) {
                    result[key] = [];
                }
                result[key].push(item[key] as any);
            }
        }
        return new GraphNode<
            T extends Record<string, unknown>
                ? MappedObject<RecordElement<T>>
                : T extends []
                ? MappedArrayObject<T>
                : never
        >(result, []);
    }

    each(f: EachFunction<T>): void {
        const val = objectPath.get(this.baseObject, this.path);
        if (!val) {
            return;
        }
        if (typeof val === 'object') {
            const call = f as any;
            Object.keys(val).forEach((k) =>
                call(
                    new GraphNode(this.baseObject, [...this.path, String(k)]),
                    k,
                ),
            );
        }
    }

    put(value: T): GraphNode<T> {
        const path = [...this.path];
        objectPath.set<T>(this.baseObject, path, value);
        return this;
    }

    delete() {
        objectPath.set(this.baseObject, this.path, undefined);
    }

    find(
        test: (v: ArrayElementOrUnknown<T>) => boolean,
    ): GraphNode<ArrayElementOrUnknown<T>> | null {
        const val = objectPath.get(this.baseObject, this.path);
        if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
                if (test(val[i])) {
                    return new GraphNode(this.baseObject, [
                        ...this.path,
                        String(i),
                    ]);
                }
            }
        }
        return null;
    }

    set(value: ArrayElementOrUnknown<T>) {
        const path = [...this.path];
        let val = objectPath.get(this.baseObject, path);
        let index;
        if (!Array.isArray(val)) {
            val = [value];
            index = 0;
        } else {
            val = [...val, value];
            index = val.length - 1;
        }
        this.put(val);
        return new GraphNode<ArrayElementOrUnknown<T>>(this.baseObject, [
            ...this.path,
            String(index),
        ]);
    }

    get key(): string {
        /*const hash = crypto.createHash('md5');
        hash.update(this.path.join('\n'));
        return hash.digest('hex');*/
        return this.path.join('.').replace(/-/g, '');
    }

    get value(): T {
        const path = [...this.path];
        const val = objectPath.get(this.baseObject, path);
        if (val === undefined) {
            throw new Error(`Value is not defined: ${this.path.join('.')}`);
        }
        return val as T;
    }

    defined(): boolean {
        return !!objectPath.get(this.baseObject, this.path);
    }
}

export class Graph<T = any> extends GraphNode<T> {
    constructor() {
        super({}, []);
    }
}
