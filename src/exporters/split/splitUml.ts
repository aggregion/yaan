import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { PlantUmlObject } from './plantUmlObject';
import { ProjectContainer } from '../../yaan/types';
import { createGraph, GraphRelation, RelationType } from '../graph/graph';
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
        data: PlantUmlObject;
        componentsUml: PlantUmlObject[]; // for components level if needed
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
            pres.key,
            pres.value.presentation,
        );
        const c1Leaves: PlantUmlObject[] = [];
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
                clusters.parents = [...infra.parents, infra.id];
                servers.parents = [...infra.parents, infra.id];
                plantGroup.children.push(deployments, infra);
                deployments.parents = [...plantGroup.parents, plantGroup.id];
                infra.parents = [...plantGroup.parents, plantGroup.id];

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
                    plantGroup.parents = [...parent.parents, parent.id];
                } else {
                    contextUml.children.push(plantGroup);
                    plantGroup.parents = [...contextUml.parents, contextUml.id];
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
            plantOrg.parents = [...contextUml.parents, contextUml.id];
            ensureGroup(new Set([org.key]), plantOrg);
        });
        pres.get('deployments').each((deployment) => {
            const plantDep = new PlantUmlDeployment(
                deployment.key,
                deployment.get('deployment').value,
                deployment.get('showDetails').value,
            );
            const ownershipGroup = ensureGroup(deployment.value.ownership);
            ownershipGroup.deployments.children.push(plantDep);
            plantDep.parents = [
                ...ownershipGroup.deployments.parents,
                ownershipGroup.deployments.id,
            ];
            deployment.get('groups').each((group) => {
                const plantGroup = new PlantUmlDeploymentGroup(
                    group.key,
                    group.get('deploymentGroup').value,
                    deployment.get('showDetails').value,
                );
                plantDep.children.push(plantGroup);
                plantGroup.parents = [...plantDep.parents, plantDep.id];
                const componentGroups: Record<string, PlantUmlComponentGroup> =
                    {};

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
                            plantComponentGroup.parents = [
                                ...plantGroup.parents,
                                plantGroup.id,
                            ];
                            c1Leaves.push(plantComponentGroup);
                            plantComponentGroup.setC1Leaf(true);
                        }
                        componentGroups[groupName].children.push(
                            plantComponent,
                        );
                        plantComponent.parents = [
                            ...componentGroups[groupName].parents,
                            componentGroups[groupName].id,
                        ];
                    } else {
                        plantGroup.children.push(plantComponent);
                        plantComponent.parents = [
                            ...plantGroup.parents,
                            plantGroup.id,
                        ];
                    }
                    component.get('ports').each((port, portName) => {
                        const plantPort = new PlantUmlComponentPort(
                            port.key,
                            port.value,
                            portName,
                        );
                        plantComponent.children.push(plantPort);
                        plantPort.parents = [
                            ...plantComponent.parents,
                            plantComponent.id,
                        ];
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

        const fullDoc = _.cloneDeep(contextUml);
        const compGroupsUml: {
            data: PlantUmlObject;
            componentsUml: PlantUmlObject[];
        }[] = [];
        for (const leaf of c1Leaves) {
            const pres = _.cloneDeep(contextUml as PlantUmlObject);
            let root = pres;
            for (let i = 1; i < leaf.parents.length; i++) {
                const object = this._findById(contextUml, leaf.parents[i]);
                if (object) {
                    root.children.length = 0;
                    root.children.push(_.cloneDeep(object));
                    root = root.children[0];
                }
            }
            root.children.length = 0;
            root.children.push(_.cloneDeep(leaf));
            compGroupsUml.push({ data: pres, componentsUml: [] });
            leaf.children.length = 0;
        }

        for (const layout of layouts) {
            if (
                this._findById(contextUml, layout.fromKey) &&
                this._findById(contextUml, layout.toKey)
            ) {
                contextUml.children.push(layout);
            }
            for (const group of compGroupsUml) {
                if (
                    this._findById(group.data, layout.fromKey) &&
                    this._findById(group.data, layout.toKey)
                ) {
                    contextUml.children.push(layout);
                }
            }
        }

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
            this._addRelToObject(
                fullDoc,
                contextUml,
                relationVal,
                direction,
                true,
            );
            for (const doc of compGroupsUml) {
                // doc.data: presentation - puml group - deployment - deployment group
                this._addRelToObject(
                    fullDoc,
                    doc.data.children[0].children[0].children[0].children[0],
                    relationVal,
                    direction,
                    false,
                );
            }
        });

        this.doc = {
            title: presentation,
            context: contextUml,
            componentGroups: compGroupsUml,
        };
    }

    private _findById(
        object: PlantUmlObject,
        id: string,
    ): PlantUmlObject | null {
        for (const child of object.children) {
            if (child.id === id) {
                return child;
            }
            const subChild = this._findById(child, id);
            if (subChild) {
                return subChild;
            }
        }
        return null;
    }

    private _findParentInObject(
        object: PlantUmlObject,
        parents: string[],
    ): string | null {
        for (let i = parents.length - 1; i >= 0; i--) {
            if (this._findById(object, parents[i])) {
                return parents[i];
            }
        }
        return null;
    }

    private _hasDuplicateRelation(
        object: PlantUmlObject,
        from: string,
        to: string,
        relType: string,
        relDir: string,
        descr?: string,
    ) {
        for (const rel of object.children) {
            if (rel instanceof PlantUmlRelation) {
                const { fromKey, toKey, type, direction, title } =
                    rel.getParams();
                if (
                    from === fromKey &&
                    to === toKey &&
                    relType === type &&
                    relDir === direction &&
                    descr === title
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    private _addRelToObject(
        fullDoc: PlantUmlObject,
        currentDoc: PlantUmlObject,
        relationVal: GraphRelation<any>,
        direction: RelationDirection,
        searchExternal: boolean,
    ): void {
        let src: string | null = relationVal.src.key;
        let dest: string | null = relationVal.dest.key;
        if (!this._findById(currentDoc, relationVal.src.key)) {
            if (searchExternal) {
                const object = this._findById(fullDoc, relationVal.src.key);
                if (object && object.parents.length > 0) {
                    src = this._findParentInObject(currentDoc, object.parents);
                }
            } else {
                src = null;
            }
        }
        if (!this._findById(currentDoc, relationVal.dest.key)) {
            if (searchExternal) {
                const object = this._findById(fullDoc, relationVal.dest.key);
                if (object && object.parents.length > 0) {
                    dest = this._findParentInObject(currentDoc, object.parents);
                }
            } else {
                dest = null;
            }
        }

        if (src && dest && src !== dest) {
            if (
                !this._hasDuplicateRelation(
                    currentDoc,
                    src,
                    dest,
                    relationVal.type,
                    direction,
                    relationVal.props?.description,
                )
            ) {
                currentDoc.children.push(
                    new PlantUmlRelation(
                        src,
                        dest,
                        relationVal.type,
                        direction,
                        relationVal.props?.description,
                    ),
                );
            }
        }
    }

    private _getGroupInfo(groupObject: PlantUmlObject): {
        id: string;
        title?: string;
        description?: string;
    } {
        // presentation - puml group - deployment - deploymentGroup
        const pumlGroupTitle = (groupObject.children[0] as PlantUmlGroup).title;
        const depTitle = (
            groupObject.children[0].children[0] as PlantUmlDeployment
        ).deployment.title;
        const depGroup = groupObject.children[0].children[0]
            .children[0] as PlantUmlDeploymentGroup;
        return {
            id: depGroup.children[0].id,
            title: `${pumlGroupTitle}-${depTitle}-${
                depGroup.deploymentGroup.title
            }-${(depGroup.children[0] as PlantUmlComponentGroup).title}`,
            description: `${
                (depGroup.children[0] as PlantUmlComponentGroup).title
            }: ${(
                depGroup.children[0] as PlantUmlComponentGroup
            ).group.components.join(', ')}`,
        };
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
            const { id, title, description } = this._getGroupInfo(
                container.data,
            );
            const compGroupPath = path.join(resPath, title || id);
            await fs.outputFile(
                path.join(compGroupPath, 'container.md'),
                description || title,
            );
            await fs.outputFile(
                path.join(compGroupPath, 'container.puml'),
                `${this.header}${container.data.print()}${this.footer}`,
            );
            for (const component of container.componentsUml) {
                const { id, title, description } =
                    this._getGroupInfo(component);
                const compPath = path.join(compGroupPath, title || id);
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
        AddElementTag("c1Leaf", $bgColor = "9ACD32", $fontColor="#3B3A2F")
        
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
}
