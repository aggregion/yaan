import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import { ProjectContainer } from '../../yaan/types';
import { PlantUml } from '../plantUml/plantUml';
import { PlantUmlObject } from '../plantUml/plantUmlObject';
import { PlantUmlGroup } from '../plantUml/plantUmlGroup';
import { PlantUmlComponentGroup } from '../plantUml/plantUmlComponentGroup';
import { PlantUmlDeploymentGroup } from '../plantUml/plantUmlDeploymentGroup';

interface ContainerLevel {
    data: PlantUmlObject;
    components: PlantUmlObject[];
}

interface SystemLevel {
    data: PlantUmlObject;
    containers: ContainerLevel[];
}

interface C4Uml {
    title: string;
    context: PlantUmlObject;
    systems: SystemLevel[];
}

export class C4Docs {
    public readonly docC4: C4Uml;
    constructor(
        private readonly project: ProjectContainer,
        private readonly presentation: string,
    ) {
        const plantUml = new PlantUml(project, presentation);

        const systems: PlantUmlObject[] = [];
        for (const puml of plantUml.children[0].children) {
            if (puml.children.length > 0) {
                systems.push(_.cloneDeep(puml));
            }
        }
        const contextPuml = plantUml;
        const systemsPuml: Record<string, any>[] = [];
        for (const system of systems) {
            for (const sysItem of system.children) {
                systemsPuml.push({
                    data: sysItem,
                    containers: [],
                });
            }
        }
        for (const systemPuml of systemsPuml) {
            if (systemPuml.data.children.length > 0) {
                for (const container of systemPuml.data.children) {
                    systemPuml.containers.push({
                        data: _.cloneDeep(container),
                        components: [],
                    });
                    if (container.children.length > 0) {
                        for (const component of container.children) {
                            systemPuml.containers[
                                systemPuml.containers.length - 1
                            ].components.push(_.cloneDeep(component));
                        }
                        container.children.length = 0;
                    }
                }
                systemPuml.data.children.length = 0;
            }
        }

        this.docC4 = {
            title: presentation,
            context: contextPuml,
            systems: systemsPuml as SystemLevel[],
        };
    }

    private _getGroupInfo(groupObject: PlantUmlObject): {
        title: string;
        description?: string;
    } {
        const defaultInfo = `${this.presentation}-group#${groupObject.id}`;
        if (groupObject instanceof PlantUmlGroup) {
            return {
                title: groupObject.title || defaultInfo,
            };
        } else if (groupObject instanceof PlantUmlComponentGroup) {
            return {
                title: groupObject.title || defaultInfo,
                description: groupObject.group.title,
            };
        } else if (groupObject instanceof PlantUmlDeploymentGroup) {
            return {
                title: groupObject.deploymentGroup.title || defaultInfo,
                description: groupObject.deploymentGroup.solution,
            };
        }
        return { title: defaultInfo };
    }

    public async print(resultPath: string): Promise<void> {
        const resPath = path.join(resultPath, this.docC4.title);
        await fs.emptyDir(resPath);
        await fs.outputFile(path.join(resPath, 'context.md'), this.docC4.title);
        await fs.outputFile(
            path.join(resPath, 'context.puml'),
            `${this.header}${this.docC4.context.print()}${this.footer}`,
        );

        for (const system of this.docC4.systems) {
            const { title, description } = this._getGroupInfo(system.data);
            const sysPath = path.join(resPath, title);
            await fs.outputFile(
                path.join(sysPath, 'system.md'),
                description || title,
            );
            await fs.outputFile(
                path.join(sysPath, 'system.puml'),
                `${this.header}${system.data.print()}${this.footer}`,
            );
            for (const container of system.containers) {
                const { title, description } = this._getGroupInfo(
                    container.data,
                );
                const contPath = path.join(sysPath, title);
                await fs.outputFile(
                    path.join(contPath, 'container.md'),
                    description || title,
                );
                await fs.outputFile(
                    path.join(contPath, 'container.puml'),
                    `${this.header}${container.data.print()}${this.footer}`,
                );
                for (const component of container.components) {
                    const { title, description } =
                        this._getGroupInfo(component);
                    const compPath = path.join(contPath, title);
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
}
