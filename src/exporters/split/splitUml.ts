import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
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

interface Group {
    group: PlantUmlObject;
    servers: PlantUmlObject;
    clusters: PlantUmlObject;
    deployments: PlantUmlObject;
}

interface SplitPlantUml {
    title: string;
    context: PlantUmlPresentation;
    componentGroups: {
        data: PlantUmlPresentation;
        componentsUml: PlantUmlPresentation[];
    }[];
}

export class SplitDocs {
    public readonly doc: SplitPlantUml;
    constructor(
        private readonly project: ProjectContainer,
        private readonly presentation: string,
    ) {
        const graph = createGraph(project);
        const pres = graph.get('presentations').get(presentation);
        if (!pres.value) {
            throw new Error(`Presentation not found: ${presentation}`);
        }

        const contextUml = new PlantUmlPresentation(
            'context',
            pres.value.presentation,
        );
        const compGroupsUml: {
            data: PlantUmlPresentation;
            componentsUml: PlantUmlPresentation[];
        }[] = [];
        const layouts: PlantUmlLayout[] = [];

        const plantGroups: Record<string, Group> = {};
        const ensureGroup = (
            ownership: Set<string>,
            parent?: PlantUmlObject,
        ): Group => {
            const groupId = Array.from(ownership).join(',\n') || 'commongroup';
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

                contextUml.children.push(
                    new PlantUmlLayout(
                        deployments.id,
                        infra.id,
                        LayoutDirection.Down,
                    ),
                );
                contextUml.children.push(
                    new PlantUmlLayout(
                        clusters.id,
                        servers.id,
                        LayoutDirection.Down,
                    ),
                );
                layouts.push(
                    new PlantUmlLayout(
                        deployments.id,
                        infra.id,
                        LayoutDirection.Down,
                    ),
                );
                layouts.push(
                    new PlantUmlLayout(
                        clusters.id,
                        servers.id,
                        LayoutDirection.Down,
                    ),
                );
                if (parent) {
                    parent.children.push(plantGroup);
                } else {
                    contextUml.children.push(plantGroup);
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
        pres.get('organizations').each((org) => {
            const plantOrg = new PlantUmlOrganization(
                org.key,
                org.get('organization').value,
            );
            contextUml.children.push(plantOrg);
            ensureGroup(new Set([org.key]), plantOrg);
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
            deployment.get('groups').each((group) => {
                const plantGroup = new PlantUmlDeploymentGroup(
                    group.key,
                    group.get('deploymentGroup').value,
                    deployment.get('showDetails').value,
                );
                plantDep.children.push(plantGroup);
                const componentGroups: Record<string, PlantUmlComponentGroup> =
                    {};

                const presForCompGroups = new PlantUmlPresentation(
                    `${group.getPath().join('-')}`,
                    pres.value.presentation,
                );
                const emptyDep = new PlantUmlDeployment(
                    `${presForCompGroups.id}-${plantDep.id}`,
                    plantDep.deployment,
                    plantDep.showDetails,
                );
                const compGroupForGroups = new PlantUmlDeploymentGroup(
                    `${emptyDep.id}-${plantGroup.id}`,
                    plantGroup.deploymentGroup,
                    plantGroup.showDetails,
                );
                presForCompGroups.children.push(emptyDep);
                emptyDep.children.push(compGroupForGroups);
                const componentsUml: PlantUmlPresentation[] = [];
                let groupAdded = false;
                group.get('components').each((component) => {
                    if (!component.value.show) {
                        return;
                    }
                    const plantComponent = new PlantUmlComponent(
                        component.key,
                        component.get('component').value,
                    );
                    if (component.value.componentGroupName) {
                        const groupName = component.value.componentGroupName;
                        if (!componentGroups[groupName]) {
                            const g = group
                                .get('componentGroups')
                                .get(groupName);
                            const plantComponentGroup =
                                new PlantUmlComponentGroup(
                                    g.key,
                                    g.value.group,
                                );
                            componentGroups[groupName] = plantComponentGroup;
                            plantGroup.children.push(plantComponentGroup);
                            compGroupForGroups.children.push(
                                plantComponentGroup,
                            );
                            if (
                                plantComponentGroup instanceof
                                PlantUmlComponentGroup
                            ) {
                                const subPres = new PlantUmlPresentation(
                                    `${presForCompGroups.id}-${groupName}`,
                                    pres.value.presentation,
                                );
                                const emptyDepForSub = new PlantUmlDeployment(
                                    `${subPres.id}-${plantDep.id}`,
                                    plantDep.deployment,
                                    plantDep.showDetails,
                                );
                                const emptyGroupForGroupsForSub =
                                    new PlantUmlDeploymentGroup(
                                        `${emptyDepForSub.id}-${plantGroup.id}`,
                                        plantGroup.deploymentGroup,
                                        plantGroup.showDetails,
                                    );
                                subPres.children.push(emptyDepForSub);
                                emptyDepForSub.children.push(
                                    emptyGroupForGroupsForSub,
                                );
                                emptyGroupForGroupsForSub.children.push(
                                    plantComponentGroup,
                                );
                                componentsUml.push(subPres);
                            }
                        }
                        compGroupForGroups.children.push(plantComponent);
                        if (!groupAdded) {
                            compGroupsUml.push({
                                data: presForCompGroups,
                                componentsUml,
                            });
                            groupAdded = true;
                        }
                    } else {
                        compGroupForGroups.children.push(plantComponent);
                        if (!groupAdded) {
                            compGroupsUml.push({
                                data: presForCompGroups,
                                componentsUml: [],
                            });
                            groupAdded = true;
                        }
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
                presForCompGroups.children.push(
                    ...layouts.filter(
                        (layout) =>
                            this._hasId(presForCompGroups, layout.fromKey) &&
                            this._hasId(presForCompGroups, layout.toKey),
                    ),
                );
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
            let direction: RelationDirection = RelationDirection.None;
            switch (relationVal.type) {
                case RelationType.DeployedOn:
                case RelationType.ClusteredOn:
                    direction = RelationDirection.Down;
                    break;
                case RelationType.UsesExternal:
                    direction = RelationDirection.Right;
                    break;
            }
            if (
                this._hasId(contextUml, relationVal.src.key) &&
                this._hasId(contextUml, relationVal.dest.key)
            ) {
                const plantRel = new PlantUmlRelation(
                    relationVal.src.key,
                    relationVal.dest.key,
                    relationVal.type,
                    direction,
                    relationVal.props?.description,
                );
                contextUml.children.push(plantRel);
            }
            for (const compGroupUml of compGroupsUml) {
                if (
                    this._hasId(compGroupUml.data, relationVal.src.key) &&
                    this._hasId(compGroupUml.data, relationVal.dest.key)
                ) {
                    const plantRel = new PlantUmlRelation(
                        relationVal.src.key,
                        relationVal.dest.key,
                        relationVal.type,
                        direction,
                        relationVal.props?.description,
                    );
                    compGroupUml.data.children.push(plantRel);
                }
                for (const component of compGroupUml.componentsUml) {
                    if (
                        this._hasId(component, relationVal.src.key) &&
                        this._hasId(component, relationVal.dest.key)
                    ) {
                        const plantRel = new PlantUmlRelation(
                            relationVal.src.key,
                            relationVal.dest.key,
                            relationVal.type,
                            direction,
                            relationVal.props?.description,
                        );
                        component.children.push(plantRel);
                    }
                }
            }
        });

        this.doc = {
            title: presentation,
            context: contextUml,
            componentGroups: compGroupsUml,
        };
    }

    private _hasId(object: PlantUmlObject, id: string): boolean {
        if (JSON.stringify(object).indexOf(id) !== -1) {
            return true;
        }
        return false;
    }

    private _getGroupInfo(groupObject: PlantUmlObject): {
        title: string;
        description?: string;
    } {
        // presentation - deployment - deploymentGroup
        const deployment = groupObject.children.filter(
            (child) => child instanceof PlantUmlDeployment,
        );
        const depGroup = deployment[0].children[0];
        const defaultInfo = depGroup.id;
        if (depGroup instanceof PlantUmlGroup) {
            return {
                title: depGroup.title || defaultInfo,
            };
        } else if (depGroup instanceof PlantUmlComponentGroup) {
            return {
                title: depGroup.title || defaultInfo,
                description: depGroup.group.title,
            };
        } else if (depGroup instanceof PlantUmlDeploymentGroup) {
            return {
                title: depGroup.deploymentGroup.title || defaultInfo,
                description: depGroup.deploymentGroup.solution,
            };
        }
        return { title: defaultInfo };
    }

    protected get header(): string {
        return `
        @startuml
        !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4.puml
        !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Deployment.puml
        !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml
        !define FONTAWESOME https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/font-awesome-5
        !define FONTAWESOME1 https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/font-awesome
        !define DEVICONS https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/devicons2
        !include FONTAWESOME/server.puml
        !include FONTAWESOME/envelope.puml
        !include FONTAWESOME1/microchip.puml
        !include FONTAWESOME1/hdd_o.puml
        !include FONTAWESOME1/lock.puml
        !include DEVICONS/kubernetes.puml
                     
        AddElementTag("hiddenGroup", $bgColor = "transparent", $borderColor="transparent")  
        AddElementTag("visibleGroup", $bgColor = "transparent", $fontColor="#3B3A2F")              
        AddElementTag("organization", $bgColor = "#FAF8C9", $shadowing="true", $shape=RoundedBoxShape())    
        AddElementTag("software", $bgColor = "#BAB995") 
        AddElementTag("infra", $bgColor = "#BAB995")                             
        AddElementTag("fallback", $bgColor="#c0c0c0")
        
        AddRelTag("fallback", $textColor="#c0c0c0", $lineColor="#438DD5")
        AddRelTag("uses-external", $textColor="#ff0000", $lineColor="#ff0000", $lineStyle=BoldLine())
        AddRelTag("uses-internal", $textColor="#3B3A2F", $lineColor="#3B3A2F", $lineStyle=DashedLine())
        AddRelTag("deployed-on", $textColor="#3B3A2F", $lineColor="#3B3A2F", $lineStyle=DashedLine())
        AddRelTag("clustered-on", $textColor="#3B3A2F", $lineColor="#3B3A2F", $lineStyle=DashedLine())

        AddElementTag("deploymentGroup", $bgColor="#BAB995")
        AddElementTag("deployment", $shadowing = true, $bgColor = "transparent")
        AddElementTag("server", $shadowing = true, $bgColor="#E0DFB4")
        AddElementTag("kubernetesCluster", $shadowing = true)
        AddElementTag("hidden", $shadowing = false, $shape = EightSidedShape(), $bgColor="#444444")

        
        WithoutPropertyHeader()
        
        `;
    }

    protected get footer(): string {
        return `
        SHOW_LEGEND()
        @enduml
        `;
    }

    public async print(resultPath: string): Promise<void> {
        const resPath = path.join(resultPath, this.doc.title);
        await fs.emptyDir(resPath);
        await fs.outputFile(
            path.join(resPath, 'context.md'),
            this.doc.context.children[0] instanceof PlantUmlPresentation
                ? this.doc.context.children[0].presentation.title
                : this.doc.title,
        );
        await fs.outputFile(
            path.join(resPath, 'context.puml'),
            `${this.header}${this.doc.context.print()}${this.footer}`,
        );
        for (const container of this.doc.componentGroups) {
            const { title, description } = this._getGroupInfo(container.data);
            const compGroupPath = path.join(resPath, container.data.id);
            await fs.outputFile(
                path.join(compGroupPath, 'container.md'),
                description || title,
            );
            await fs.outputFile(
                path.join(compGroupPath, 'container.puml'),
                `${this.header}${container.data.print()}${this.footer}`,
            );
            for (const component of container.componentsUml) {
                const { title, description } = this._getGroupInfo(component);
                const compPath = path.join(compGroupPath, component.id);
                await fs.outputFile(
                    path.join(compPath, 'component.md'),
                    description || title,
                );
                await fs.outputFile(
                    path.join(compPath, 'component.puml'),
                    `${this.header}${component.print()}${this.footer}`,
                );
            }
        }
    }
}
