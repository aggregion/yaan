import { ProjectContainer } from '../../yaan/types';
import { SolutionComponent } from '../../yaan/schemas/solution';
import { DeploymentExternalConnection } from '../../yaan/schemas/deployment';
import * as uuid from 'uuid';

type MapValueType<A> = A extends Map<any, infer V> ? V : never;

export class GraphNode {
    constructor(
        public object: Record<string, any> = { '#': {} },
        public name: string = '#',
    ) {}

    get(name: string): GraphNode {
        if (!this.object[this.name][name]) {
            this.object[this.name][name] = {};
        }
        return new GraphNode(this.object[this.name], name);
    }

    put(value: any) {
        if (value === undefined) {
            return this;
        }
        if (typeof value.valueOf === 'function') {
            value = value.valueOf();
        }
        value._key = uuid.v4().replace(/-/g, '');
        this.object[this.name] = value;
        return this;
    }

    set(value: any) {
        if (value !== undefined && typeof value.valueOf === 'function') {
            value = value.valueOf();
        }
        if (!Array.isArray(this.object[this.name])) {
            this.object[this.name] = [];
        }
        const len = this.object[this.name].push(value);
        return new GraphNode(this.object[this.name], String(len - 1));
    }

    get value(): any {
        return this.valueOf();
    }

    valueOf(): any {
        const val = this.object[this.name];
        if (typeof val === 'object' && Object.keys(val).length === 0) {
            return null;
        }
        return val;
    }

    map() {
        if (typeof this.object[this.name] === 'object') {
            return Object.entries(this.object[this.name]).map(([k, v]) => [
                v,
                k,
            ]);
        } else if (Array.isArray(this.object[this.name])) {
            return this.object[this.name];
        }
    }
}

/*

presentations:
    pres1:
        allComponents:
            - componentName
              groupName
              deploymentName
              component
        relations:
            - src:
              dest:
              type:
              title:
              resolved:
              props:
        servers:
        clusters:
            cluster1:
                value:
                relations:
                    usesAs:
                        worker:
                        master:

        deployments:
            dep1:
                value:
                groups:
                    group1:
                        relations:
                            deployedOn:
                        value:
                        components:
                            comp1:
                                value:
                                ports:
                                  port1:
                                    number:
        relations:
            rel1:
                src:
                dest:
                predicate:
                props:

 */

export const createGraph = (project: ProjectContainer) => {
    const getFromProject = <T extends keyof ProjectContainer>(
        collection: T,
        key: string,
    ) => {
        const val = project[collection].get(key);
        if (!val) {
            throw new Error(`Value not found: ${collection}/${key}`);
        }
        return val as MapValueType<ProjectContainer[T]>;
    };

    const graph = new GraphNode();

    for (const [presName, pres] of project.presentations) {
        const gunPres = graph.get('presentations').get(presName).put({
            name: presName,
            value: pres,
        });
        for (const presDepValue of pres.deployments) {
            let depName;
            if (typeof presDepValue === 'string') {
                depName = presDepValue;
            } else {
                depName = presDepValue.name;
            }
            const dep = getFromProject('deployments', depName);
            const gunDep = gunPres.get('deployments').get(depName).put({
                value: dep,
            });
            for (const [dgName, dg] of Object.entries(dep.deploymentGroups)) {
                const gunDg = gunDep
                    .get('groups')
                    .get(dgName)
                    .put({ value: dg });
                let dgContainer;
                switch (dg.type) {
                    case 'KubernetesCluster':
                        const cluster = getFromProject(
                            'kubernetesClusters',
                            dg.cluster,
                        );
                        const existingCluster = gunPres
                            .get('clusters')
                            .get(dg.cluster);
                        if (existingCluster.value) {
                            dgContainer = existingCluster;
                        } else {
                            const gunCluster = existingCluster.put({
                                value: cluster,
                            });
                            for (const [srvName, srv] of Object.entries(
                                cluster.servers,
                            )) {
                                const server = getFromProject(
                                    'servers',
                                    srvName,
                                );
                                const gunServer = gunPres
                                    .get('servers')
                                    .get(srvName)
                                    .put({
                                        value: server,
                                    });
                                gunPres.get('relations').set({
                                    src: gunCluster,
                                    dest: gunServer,
                                    resolved: true,
                                    type: '-->',
                                    props: {
                                        description: srv.type,
                                    },
                                });
                            }
                            dgContainer = gunCluster;
                        }
                        break;
                    case 'Server':
                        const server = getFromProject('servers', dg.server);
                        const gunServer = gunPres
                            .get('servers')
                            .get(dg.server)
                            .put({
                                value: server,
                            });
                        dgContainer = gunServer;
                        break;
                }
                gunPres.get('relations').set({
                    src: gunDg,
                    dest: dgContainer,
                    type: '-->',
                    resolved: true,
                    props: {
                        description: 'Deployed on',
                    },
                });
                const solution = getFromProject('solutions', dg.solution);
                if (dg.components) {
                    const componentsToDeploy: Record<
                        string,
                        SolutionComponent & {
                            connections?: DeploymentExternalConnection[];
                        }
                    > = {};
                    const componentConnections: Record<
                        string,
                        DeploymentExternalConnection[]
                    > = {};
                    for (const compValue of dg.components) {
                        if (typeof compValue === 'string') {
                            if (compValue === '*') {
                                Object.entries(solution.components).forEach(
                                    ([name, component]) => {
                                        componentsToDeploy[name] = component;
                                    },
                                );
                            } else {
                                const val = solution.components[compValue];
                                if (!val) {
                                    throw new Error(
                                        `Undefined component: ${compValue}`,
                                    );
                                }
                                componentsToDeploy[compValue] = val;
                            }
                        } else {
                            if (compValue.disabled) {
                                delete componentsToDeploy[compValue.name];
                            } else {
                                const val = solution.components[compValue.name];
                                if (!val) {
                                    throw new Error(
                                        `Undefined component: ${compValue.name}`,
                                    );
                                }
                                componentsToDeploy[compValue.name] = val;
                                if (compValue.externalConnections) {
                                    componentConnections[compValue.name] =
                                        compValue.externalConnections;
                                }
                            }
                        }
                    }
                    for (const [compName, comp] of Object.entries(
                        componentsToDeploy,
                    )) {
                        const ports: Record<string, any> = {};
                        if (comp.ports) {
                            for (const [portName, portValue] of Object.entries(
                                comp.ports,
                            )) {
                                if (typeof portValue === 'object') {
                                    ports[portName] = { ...portValue };
                                } else {
                                    ports[portName] = { number: portValue };
                                }
                                ports[portName].title = portName;
                            }
                        }
                        const val = { value: comp };
                        const gunComp = gunDg
                            .get('components')
                            .get(compName)
                            .put(val);
                        for (const [portName, port] of Object.entries(ports)) {
                            gunDg
                                .get('components')
                                .get(compName)
                                .get('ports')
                                .get(portName)
                                .put(port);
                        }
                        gunPres.get('allComponents').set({
                            deploymentName: depName,
                            groupName: dgName,
                            componentName: compName,
                            component: gunComp,
                        });
                        if (comp.uses) {
                            for (const compUsage of comp.uses) {
                                if (typeof compUsage === 'string') {
                                    const usingComponent =
                                        solution.components[compUsage];
                                    if (!usingComponent) {
                                        throw new Error(
                                            `Using component is not defined: ${compUsage}`,
                                        );
                                    }
                                    gunPres.get('relations').set({
                                        src: gunComp,
                                        dest: null,
                                        resolved: false,
                                        type: '-->',
                                        props: {
                                            component: {
                                                deployment: depName,
                                                group: dgName,
                                                component: compUsage,
                                            },
                                        },
                                    });
                                } else {
                                    const usingComponent =
                                        solution.components[compUsage.name];
                                    if (!usingComponent) {
                                        throw new Error(
                                            `Using component is not defined: ${compUsage.name}`,
                                        );
                                    }
                                    const usingPort =
                                        usingComponent.ports?.[compUsage.port];
                                    if (!usingPort) {
                                        throw new Error(
                                            `Can't find component port. Component: ${compUsage.name}, port: ${compUsage.port}`,
                                        );
                                    }
                                    gunPres.get('relations').set({
                                        src: gunComp,
                                        dest: null,
                                        resolved: false,
                                        type: '-->',
                                        props: {
                                            componentPort: {
                                                deployment: depName,
                                                group: dgName,
                                                component: compUsage.name,
                                                port: compUsage.port,
                                            },
                                            description: compUsage.description,
                                            required: compUsage.required,
                                        },
                                    });
                                }
                            }
                        }
                        if (componentConnections[compName]) {
                            for (const connection of componentConnections[
                                compName
                            ]) {
                                gunPres.get('relations').set({
                                    src: gunComp,
                                    dest: null,
                                    resolved: false,
                                    type: '-->',
                                    props: {
                                        deploymentGroup: {
                                            deployment: connection.deployment,
                                            deploymentGroup:
                                                connection.deploymentGroup,
                                            component: connection.component,
                                            port: connection.port,
                                        },
                                    },
                                });
                                gunComp.get('connections').set(connection);
                            }
                        }
                    }
                }
            }
        }

        // Resolve relations
        const relations = gunPres.get('relations').value;
        for (const rel of relations.filter(
            (rel: any) => !rel.resolved,
        ) as any) {
            const props = rel.props;
            if (props.component) {
                const dest = gunPres
                    .get('deployments')
                    .get(props.component.deployment)
                    .get('groups')
                    .get(props.component.group)
                    .get('components')
                    .get(props.component.component);
                if (dest.value) {
                    rel.dest = dest;
                    rel.resolved = true;
                } else if (props.required) {
                    throw new Error(
                        `Component does not exist in current scope: ${props.component.deployment}/${props.component.group}`,
                    );
                }
            } else if (props.componentPort) {
                const dest = gunPres
                    .get('deployments')
                    .get(props.componentPort.deployment)
                    .get('groups')
                    .get(props.componentPort.group)
                    .get('components')
                    .get(props.componentPort.component)
                    .get('ports')
                    .get(props.componentPort.port);
                if (dest.value) {
                    rel.dest = dest;
                    rel.resolved = true;
                } else if (props.required) {
                    throw new Error(
                        `Component does not exist in current scope: ${props.component.deployment}/${props.component.group}`,
                    );
                }
            } else if (props.deploymentGroup) {
                const allComponents = gunPres.get('allComponents').value;
                const dg = props.deploymentGroup;
                // console.log('SRC', rel.src.value._key);
                // console.log('DG', dg);
                const componentsToBind = allComponents.filter(
                    (comp: any) =>
                        (!dg.deployment ||
                            dg.deployment === comp.deploymentName) &&
                        (!dg.deploymentGroup ||
                            dg.deploymentGroup === comp.groupName) &&
                        dg.component === comp.componentName &&
                        rel.src.value._key !== comp.component.value._key,
                );
                for (const comp of componentsToBind) {
                    let bindItem = comp.component;
                    if (dg.port) {
                        bindItem = bindItem.get('ports').get(dg.port);
                    }
                    if (!bindItem.value) {
                        throw new Error(
                            `Can't resolve deployment group external connection: ${
                                dg.deployment || '*'
                            }/${dg.deploymentGroup || '*'}/${dg.component}/${
                                dg.port || '*'
                            }`,
                        );
                    }
                    rel.dest = bindItem;
                    rel.resolved = true;
                }
            }
        }
        gunPres.get('relations').put(relations.filter((r: any) => r.resolved));
    }
    return graph;
};
