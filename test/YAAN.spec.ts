import path from 'path';
import { YAAN } from '../src/yaan/yaan';
import { ProjectContainer } from '../src/yaan/types';
import glob from 'glob';

describe('YAAN', () => {
    test('should load project from dir', () => {
        const dir = path.join(__dirname, 'testdata', 'valid-configs');
        const yaan = new YAAN();
        let project: ProjectContainer;
        expect(() => (project = yaan.loadProjectFromDir(dir))).not.toThrow();
        const projectEntitiesCount = [
            'deployments',
            'kubernetesClusters',
            'presentations',
            'providers',
            'servers',
            'solutions',
        ]
            .map((prop) => (project as any)[prop])
            .reduce((val, map) => val + map.size, 0);
        const files = glob.sync(path.join(dir, '**/*.yaml'));
        expect(files.length).toBeGreaterThan(0);
        expect(projectEntitiesCount).toBe(files.length);
    });
});
