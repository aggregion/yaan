import { ProjectContainer } from '../../yaan/types';
import {
    SolutionComponent,
    SolutionComponentGroup,
    SolutionPort,
} from '../../yaan/schemas/solution';
import {
    Deployment,
    DeploymentComponentDetailed,
    DeploymentComponentFromGroup,
    DeploymentExternalConnection,
    DeploymentGroup,
} from '../../yaan/schemas/deployment';
import { Graph, GraphNode } from '../../yaan/graph';
import { Server } from '../../yaan/schemas/server';
import { KubernetesCluster } from '../../yaan/schemas/kubernetesCluster';
import { Presentation } from '../../yaan/schemas/presentation';

type MapValueType<A> = A extends Map<any, infer V> ? V : never;

enum RelationType {
    UsesInternal = 'uses-internal',
    UsesExternal = 'uses-external',
    DeployedOn = 'deployed-on',
    ClusteredOn = 'clustered-on',
}

export interface GraphRelationPropsByType {
    'uses-internal': never;
    'uses-external': never;
    'deployed-on': never;
    'clustered-on': {
        clusterNodeType: 'worker' | 'master';
    };
}

export interface GraphRelation<T extends RelationType> {
    src: GraphNode<any>;
    dest: GraphNode<any>;
    type: T;
    props: GraphRelationPropsByType[T];
}

export interface GraphServer {
    server: Server;
    showHardwareDetails: boolean;
}

export interface GraphKubernetesCluster {
    kubernetesCluster: KubernetesCluster;
    showDetails: boolean;
}

export interface GraphPresentation {
    relations: GraphRelation<any>[];
    servers: Record<string, GraphServer>;
    kubernetesClusters: Record<string, GraphKubernetesCluster>;
    deployments: Record<
        string,
        {
            showDetails: boolean;
            deployment: Deployment;
            groups: Record<
                string,
                {
                    deploymentGroup: DeploymentGroup;
                    componentGroups: Record<
                        string,
                        {
                            group: SolutionComponentGroup;
                        }
                    >;
                    components: Record<
                        string,
                        {
                            show: boolean;
                            component: SolutionComponent;
                            componentGroupName?: string;
                            ports: Record<string, SolutionPort>;
                        }
                    >;
                }
            >;
        }
    >;
    presentation: Presentation;
}

export interface GraphScheme {
    presentations: Record<string, GraphPresentation>;
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

    const graph = new Graph<GraphScheme>();

    for (const [presName, pres] of project.presentations) {
        const deferredResolveRelations: {
            src: GraphNode<any>;
            deployment?: string;
            group?: string;
            component: string;
            port?: string;
            srcDeployment: string;
            srcGroup: string;
            srcComponent: string;
            description?: string;
        }[] = [];
        const gunPres = graph.get('presentations').get(presName).put({
            relations: [],
            servers: {},
            kubernetesClusters: {},
            deployments: {},
            presentation: pres,
        });
        for (const presDepValue of pres.deployments) {
            let depName;
            let hideComponents;
            if (typeof presDepValue === 'string') {
                depName = presDepValue;
                hideComponents = false;
            } else {
                depName = presDepValue.name;
                hideComponents = presDepValue.showOnlyExternallyConnected;
            }
            const dep = getFromProject('deployments', depName);
            const gunDep = gunPres.get('deployments').get(depName).put({
                deployment: dep,
                showDetails: !hideComponents,
                groups: {},
            });
            for (const [dgName, dg] of Object.entries(dep.deploymentGroups)) {
                const gunDg = gunDep.get('groups').get(dgName).put({
                    deploymentGroup: dg,
                    componentGroups: {},
                    components: {},
                });
                let dgContainer;
                switch (dg.type) {
                    case 'KubernetesCluster':
                        const cluster = getFromProject(
                            'kubernetesClusters',
                            dg.cluster,
                        );
                        const gunCluster = gunPres
                            .get('kubernetesClusters')
                            .get(dg.cluster);
                        if (!gunCluster.defined()) {
                            gunCluster.put({
                                kubernetesCluster: cluster,
                                showDetails: !hideComponents,
                            });
                        }
                        for (const [srvName, srv] of Object.entries(
                            cluster.servers,
                        )) {
                            const server = getFromProject('servers', srvName);
                            const gunServer = gunPres
                                .get('servers')
                                .get(srvName)
                                .put({
                                    server: server,
                                    showHardwareDetails: !hideComponents,
                                });
                            gunPres.get('relations').set({
                                src: gunCluster,
                                dest: gunServer,
                                type: RelationType.ClusteredOn,
                                props: {
                                    clusterNodeType: srv.type,
                                },
                            });
                        }
                        dgContainer = gunCluster;
                        break;
                    case 'Server':
                        const server = getFromProject('servers', dg.server);
                        const gunServer = gunPres
                            .get('servers')
                            .get(dg.server)
                            .put({
                                server: server,
                                showHardwareDetails: !hideComponents,
                            });
                        dgContainer = gunServer;
                        break;
                }
                gunPres.get('relations').set({
                    src: gunDg,
                    dest: dgContainer,
                    type: RelationType.DeployedOn,
                    props: {
                        description: 'Deployed on',
                    },
                });
                const solution = getFromProject('solutions', dg.solution);
                if (dg.components) {
                    const groupsMap: Record<
                        string,
                        { name: string; value: SolutionComponentGroup }
                    > = {};
                    if (solution.groups) {
                        Object.entries(solution.groups).forEach(([k, v]) => {
                            v.components.forEach((c) => {
                                if (groupsMap[c]) {
                                    if (groupsMap[c].name === k) {
                                        throw new Error(
                                            `Component "${c}" included in group "${k}" several times.`,
                                        );
                                    } else {
                                        throw new Error(
                                            `Component "${c}" included in multiple groups.`,
                                        );
                                    }
                                }
                                groupsMap[c] = { name: k, value: v };
                                gunDg.get('componentGroups').get(k).put({
                                    group: v,
                                });
                            });
                        });
                    }
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
                            if (compValue.hasOwnProperty('fromGroup')) {
                                const cv =
                                    compValue as DeploymentComponentFromGroup;
                                const group =
                                    solution.groups &&
                                    solution.groups[cv.fromGroup];
                                if (!group) {
                                    throw new Error(
                                        `Unknown group ${cv.fromGroup}`,
                                    );
                                }
                                for (const compName of group.components) {
                                    if (compValue.disabled) {
                                        delete componentsToDeploy[compName];
                                        continue;
                                    }
                                    const val = solution.components[compName];
                                    if (!val) {
                                        throw new Error(
                                            `Undefined component: ${compValue}`,
                                        );
                                    }
                                    componentsToDeploy[compName] = val;
                                }
                            } else {
                                const cv =
                                    compValue as DeploymentComponentDetailed;
                                if (compValue.disabled) {
                                    delete componentsToDeploy[cv.name];
                                } else {
                                    const val = solution.components[cv.name];
                                    if (!val) {
                                        throw new Error(
                                            `Undefined component: ${cv.name}`,
                                        );
                                    }
                                    componentsToDeploy[cv.name] = val;
                                    if (cv.externalConnections) {
                                        componentConnections[cv.name] =
                                            cv.externalConnections;
                                    }
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
                        const gunComp = gunDg
                            .get('components')
                            .get(compName)
                            .put({
                                show: !hideComponents,
                                component: comp,
                                componentGroupName:
                                    groupsMap[compName] &&
                                    groupsMap[compName].name,
                                ports: {},
                            });
                        for (const [portName, port] of Object.entries(ports)) {
                            gunComp.get('ports').get(portName).put(port);
                        }
                        if (!hideComponents && comp.uses) {
                            for (const compUsage of comp.uses) {
                                if (typeof compUsage === 'string') {
                                    if (!componentsToDeploy[compUsage]) {
                                        continue;
                                    }
                                    const usingComponent =
                                        solution.components[compUsage];
                                    if (!usingComponent) {
                                        throw new Error(
                                            `Using component is not defined: ${compUsage}`,
                                        );
                                    }
                                    gunPres.get('relations').set({
                                        src: gunComp,
                                        dest: gunPres
                                            .get('deployments')
                                            .get(depName)
                                            .get('groups')
                                            .get(dgName)
                                            .get('components')
                                            .get(compUsage),
                                        type: RelationType.UsesInternal,
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
                                    if (!componentsToDeploy[compUsage.name]) {
                                        continue;
                                    }
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
                                        dest: gunPres
                                            .get('deployments')
                                            .get(depName)
                                            .get('groups')
                                            .get(dgName)
                                            .get('components')
                                            .get(compUsage.name)
                                            .get('ports')
                                            .get(compUsage.port),
                                        type: RelationType.UsesInternal,
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
                        if (!hideComponents && componentConnections[compName]) {
                            for (const connection of componentConnections[
                                compName
                            ]) {
                                deferredResolveRelations.push({
                                    src: gunComp,
                                    deployment: connection.deployment,
                                    group: connection.deploymentGroup,
                                    component: connection.component,
                                    port: connection.port,
                                    srcGroup: dgName,
                                    srcDeployment: depName,
                                    srcComponent: compName,
                                    description: connection.description,
                                });
                            }
                        }
                    }
                }
            }
        }

        // Resolve relations
        for (const defRel of deferredResolveRelations) {
            gunPres.get('deployments').each((dep, depName) => {
                if (defRel.deployment && depName !== defRel.deployment) {
                    return;
                }
                dep.get('groups').each((group, groupName) => {
                    if (defRel.group && groupName !== defRel.group) {
                        return;
                    }
                    group.get('components').each((comp, compName) => {
                        if (defRel.component && compName !== defRel.component) {
                            return;
                        }
                        // Skip self-links
                        if (
                            defRel.srcDeployment === depName &&
                            defRel.srcGroup === groupName &&
                            defRel.srcComponent === compName
                        ) {
                            return;
                        }
                        comp.get('show').put(true);
                        if (defRel.port) {
                            comp.get('ports').each((port, portName) => {
                                if (portName === defRel.port) {
                                    gunPres.get('relations').set({
                                        src: defRel.src,
                                        dest: port,
                                        type: RelationType.UsesExternal,
                                        props: {
                                            description: defRel.description,
                                        },
                                    });
                                }
                            });
                        } else {
                            gunPres.get('relations').set({
                                src: defRel.src,
                                dest: comp,
                                type: RelationType.UsesExternal,
                                props: {
                                    description: defRel.description,
                                },
                            });
                        }
                    });
                });
            });
        }
    }
    return graph;
};
