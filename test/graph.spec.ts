import { Graph } from '../src/yaan/graph';

describe('Graph', () => {
    test('should work correctly', () => {
        const graph = new Graph();
        graph.get('object').get('prop1').put(1);
        graph.get('object').get('prop2').put(2);
        expect(graph.get('object').get('prop1').value).toBe(1);
        expect(graph.get('object').get('prop2').value).toBe(2);
        graph
            .get('object')
            .get('nested')
            .put({ prop: {} })
            .get('prop')
            .get('prop3')
            .put(3);
        expect(
            graph.get('object').get('nested').get('prop').get('prop3').value,
        ).toBe(3);
        graph.get('object').get('nested').delete();
        expect(
            () =>
                graph.get('object').get('nested').get('prop').get('prop3')
                    .value,
        ).toThrow();
        expect(
            graph
                .get('object')
                .get('nested')
                .get('prop')
                .get('prop3')
                .defined(),
        ).toBe(false);

        expect(graph.get('object').get('prop1').key).toBeDefined();
        expect(graph.get('object').get('prop1').key).not.toBe(
            graph.get('object').get('prop2').key,
        );
    });

    test('map should work correctly', () => {
        const graph = new Graph<{
            users: Record<string, { name: string; props: { age?: number } }>;
            documents: { link: string }[];
        }>();
        graph.get('users').put({
            bob: { name: 'Bob', props: { age: 23 } },
            alice: { name: 'Alice', props: { age: 22 } },
            petr: { name: 'Petr', props: {} },
        });
        graph.get('documents').set({ link: '1' });
        graph.get('documents').set({ link: '2' });
        expect(
            graph.get('users').map().get('props').map().get('age').value,
        ).toStrictEqual([23, 22]);
        expect(
            graph
                .get('users')
                .map((name) => name === 'bob')
                .get('props')
                .map()
                .get('age').value,
        ).toStrictEqual([23]);
    });
});
