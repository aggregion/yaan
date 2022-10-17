import { PlantUmlObject } from './plantUmlObject';
import { ProjectContainer } from '../../yaan/types';
import { createGraph, RelationType } from '../graph/graph';
import { PlantUmlServer } from './plantUmlServer';
import { PlantUmlPresentation } from './plantUmlPresentation';
import { PlantUmlKubernetesCluster } from './plantUmlKubernetesCluster';
import { PlantUmlDeployment } from './plantUmlDeployment';
import { PlantUmlDeploymentGroup } from './plantUmlDeploymentGroup';
import { PlantUmlComponent } from './plantUmlComponent';
import { PlantUmlComponentPort } from './plantUmlComponentPort';
import { PlantUmlRelation, RelationDirection } from './plantUmlRelation';
import { PlantUmlComponentGroup } from './plantUmlComponentGroup';
import { PlantUmlOrganization } from './plantUmlOrganization';
import { GroupVisibility, PlantUmlGroup } from './plantUmlGroup';
import { LayoutDirection, PlantUmlLayout } from './plantUmlLayout';
import { GraphNode } from '../../yaan/graph';

interface Group {
    group: PlantUmlObject;
    servers: PlantUmlObject;
    clusters: PlantUmlObject;
    deployments: PlantUmlObject;
}

export class PlantUml extends PlantUmlObject {
    constructor(
        private readonly project: ProjectContainer,
        private readonly presentation: string,
    ) {
        super('#');
        const graph = createGraph(project);
        const pres = graph.get('presentations').get(presentation);
        if (!pres.value) {
            throw new Error(`Presentation not found: ${presentation}`);
        }
        const presObj = new PlantUmlPresentation(
            pres.key,
            pres.value.presentation,
        );
        this.children.push(presObj);

        const plantGroups: Record<string, Group> = {};
        const ensureGroup = (
            ownership: Set<string>,
            parent?: PlantUmlObject,
        ): Group => {
            const groupId = Array.from(ownership).join('Z') || 'commongroup';
            if (plantGroups[groupId]) {
                return plantGroups[groupId];
            } else {
                const plantGroup = new PlantUmlGroup(groupId + 'group');
                const infra = new PlantUmlGroup(
                    groupId + 'infra',
                    GroupVisibility.HiddenIfEmpty,
                    'Infrastructure',
                    ['infra'],
                );
                const servers = new PlantUmlGroup(
                    groupId + 'servers',
                    GroupVisibility.HiddenIfEmpty,
                    'Servers',
                );
                const clusters = new PlantUmlGroup(
                    groupId + 'clusters',
                    GroupVisibility.HiddenIfEmpty,
                    'Virtualization',
                );
                const deployments = new PlantUmlGroup(
                    groupId + 'deployments',
                    GroupVisibility.HiddenIfEmpty,
                    'Software',
                    ['software'],
                );
                infra.children.push(clusters, servers);
                plantGroup.children.push(deployments, infra);

                presObj.children.push(
                    new PlantUmlLayout(
                        deployments.id,
                        infra.id,
                        LayoutDirection.Down,
                    ),
                );
                presObj.children.push(
                    new PlantUmlLayout(
                        clusters.id,
                        servers.id,
                        LayoutDirection.Down,
                    ),
                );
                if (parent) {
                    parent.children.push(plantGroup);
                } else {
                    presObj.children.push(plantGroup);
                }
                plantGroups[groupId] = {
                    group: plantGroup,
                    servers,
                    clusters,
                    deployments,
                };
                return plantGroups[groupId];
            }
        };
        let prevOrg: GraphNode<any> | null = null;
        pres.get('organizations').each((org) => {
            const plantOrg = new PlantUmlOrganization(
                org.key,
                org.get('organization').value,
            );
            presObj.children.push(plantOrg);
            ensureGroup(new Set([org.key]), plantOrg);
            if (prevOrg) {
                presObj.children.push(
                    new PlantUmlLayout(
                        prevOrg.key,
                        org.key,
                        LayoutDirection.Down,
                    ),
                );
            }
            prevOrg = org;
        });
        pres.get('deployments').each((deployment) => {
            const plantDep = new PlantUmlDeployment(
                deployment.key,
                deployment.get('deployment').value,
                deployment.get('showDetails').value,
            );
            ensureGroup(deployment.value.ownership).deployments.children.push(
                plantDep,
            );
            // presObj.children.push(plantDep);
            let prevGroup: PlantUmlDeploymentGroup | undefined;
            deployment.get('groups').each((group) => {
                const plantGroup = new PlantUmlDeploymentGroup(
                    group.key,
                    group.get('deploymentGroup').value,
                    deployment.get('showDetails').value,
                );
                plantDep.children.push(plantGroup);
                if (prevGroup) {
                    presObj.children.push(
                        new PlantUmlLayout(
                            prevGroup.id,
                            plantGroup.id,
                            LayoutDirection.Right,
                        ),
                    );
                }
                prevGroup = plantGroup;
                const componentGroups: Record<string, PlantUmlComponentGroup> =
                    {};
                let prevCompGroup: PlantUmlObject | undefined;
                group.get('components').each((component) => {
                    if (!component.value.show) {
                        return;
                    }
                    const plantComponent = new PlantUmlComponent(
                        component.key,
                        component.get('component').value,
                        component.value.namespace,
                    );
                    if (component.value.componentGroupName) {
                        const groupName = component.value.componentGroupName;
                        if (!componentGroups[groupName]) {
                            const g = group
                                .get('componentGroups')
                                .get(groupName);
                            const plantComponentGroup =
                                new PlantUmlComponentGroup(
                                    group.key + g.key,
                                    g.value.group,
                                );
                            componentGroups[groupName] = plantComponentGroup;
                            plantGroup.children.push(plantComponentGroup);
                            if (prevCompGroup) {
                                presObj.children.push(
                                    new PlantUmlLayout(
                                        prevCompGroup.id,
                                        plantComponentGroup.id,
                                        LayoutDirection.Down,
                                    ),
                                );
                            }
                            prevCompGroup = plantComponentGroup;
                        }
                        componentGroups[groupName].children.push(
                            plantComponent,
                        );
                    } else {
                        plantGroup.children.push(plantComponent);
                    }
                    component.get('ports').each((port, portName) => {
                        const plantPort = new PlantUmlComponentPort(
                            port.key,
                            port.value,
                            portName,
                        );
                        plantComponent.children.push(plantPort);
                    });
                });
            });
        });
        pres.get('servers').each((server) => {
            const plantSrv = new PlantUmlServer(
                server.key,
                server.get('server').value,
                server.get('showHardwareDetails').value,
            );
            ensureGroup(server.value.ownership).servers.children.push(plantSrv);
        });
        pres.get('kubernetesClusters').each((cluster) => {
            const plantCluster = new PlantUmlKubernetesCluster(
                cluster.key,
                cluster.get('kubernetesCluster').value,
                cluster.get('showDetails').value,
            );
            ensureGroup(cluster.value.ownership).clusters.children.push(
                plantCluster,
            );
        });
        pres.get('relations').each((relation) => {
            const relationVal = relation.value;
            if (relationVal.type === RelationType.OwnedBy) {
                return;
            }
            let direction: RelationDirection = RelationDirection.Up;
            switch (relationVal.type) {
                case RelationType.DeployedOn:
                case RelationType.ClusteredOn:
                    direction = RelationDirection.Neighbor;
                    break;
                case RelationType.UsesExternal:
                    direction = RelationDirection.Down;
                    break;
            }
            const plantRel = new PlantUmlRelation(
                relationVal.src.key,
                relationVal.dest.key,
                relationVal.type,
                direction,
                relationVal.props?.description,
            );
            presObj.children.push(plantRel);
        });
    }

    protected get header(): string {
        return `
        @startuml
        
        ${this.printIncludes()}
        
        skinparam nodesep 100   
        skinparam ranksep 1000     
        skinparam rectangle<<organization>> {
          FontSize 64
        }
        
        skinparam rectangle<<visibleGroup>> {
          FontSize 8
        }
        
        skinparam rectangle<<container>> {
          FontSize 16
          FontColor black
        }
        
        skinparam arrow {
          FontSize 24
        }


        
        HIDE_STEREOTYPE()
                 
        AddElementTag("hiddenGroup", $bgColor = "transparent", $borderColor="transparent")  
        AddElementTag("visibleGroup", $bgColor = "transparent", $fontColor="#3B3A2F")              
        AddElementTag("organization", $shape=RoundedBoxShape(), $bgColor="#f5f5f5")   
        AddElementTag("server", $shape=RoundedBoxShape(), $bgColor="#ebffee")  


        AddRelTag("uses-external", $lineStyle=BoldLine())
        AddRelTag("uses-internal", $lineStyle=BoldLine())
        AddRelTag("deployed-on", $lineStyle=DottedLine())
        AddRelTag("clustered-on", $lineStyle=DottedLine())

        
        WithoutPropertyHeader()
        
        `;
    }

    protected get footer(): string {
        return `
        @enduml
        `;
    }

    protected get includes(): Set<string> {
        return new Set([
            '<C4/C4>',
            '<C4/C4_Container>',
            '<C4/C4_Component>',
            '<C4/C4_Deployment>',
            '<C4/C4_Context>',
        ]);
    }
}
