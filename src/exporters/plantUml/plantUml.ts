import { PlantUmlObject } from './plantUmlObject';
import { ProjectContainer } from '../../yaan/types';
import { createGraph } from '../graph/graph';
import { PlantUmlServer } from './plantUmlServer';
import { PlantUmlPresentation } from './plantUmlPresentation';
import { PlantUmlKubernetesCluster } from './plantUmlKubernetesCluster';
import { PlantUmlDeployment } from './plantUmlDeployment';
import { PlantUmlDeploymentGroup } from './plantUmlDeploymentGroup';
import { PlantUmlComponent } from './plantUmlComponent';
import { PlantUmlComponentPort } from './plantUmlComponentPort';
import { PlantUmlRelation } from './plantUmlRelation';

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
            pres.value._key,
            pres.value.value,
        );
        this.children.push(presObj);
        const servers = pres.get('servers').value;
        for (const server of Object.values(servers) as any) {
            presObj.children.push(
                new PlantUmlServer(server._key, server.value),
            );
        }
        const clusters = pres.get('clusters').value;
        for (const cluster of Object.values(clusters) as any) {
            presObj.children.push(
                new PlantUmlKubernetesCluster(cluster._key, cluster.value),
            );
        }
        const deployments = pres.get('deployments');
        for (const [depName, deployment] of Object.entries(
            deployments.value,
        ) as any) {
            const plantDep = new PlantUmlDeployment(
                deployment._key,
                deployment.value,
            );
            presObj.children.push(plantDep);
            const groups = pres.get('deployments').get(depName).get('groups');
            if (groups.value) {
                for (const [groupName, group] of Object.entries(
                    groups.value,
                ) as any) {
                    const plantGroup = new PlantUmlDeploymentGroup(
                        group._key,
                        group.value,
                    );
                    plantDep.children.push(plantGroup);
                    const components = pres
                        .get('deployments')
                        .get(depName)
                        .get('groups')
                        .get(groupName)
                        .get('components');
                    if (components.value) {
                        for (const [compName, component] of Object.entries(
                            components.value,
                        ) as any) {
                            const plantComponent = new PlantUmlComponent(
                                component._key,
                                component.value,
                            );
                            plantGroup.children.push(plantComponent);
                            const ports = pres
                                .get('deployments')
                                .get(depName)
                                .get('groups')
                                .get(groupName)
                                .get('components')
                                .get(compName)
                                .get('ports');
                            if (ports.value) {
                                for (const [, port] of Object.entries(
                                    ports.value,
                                ) as any) {
                                    const plantPort = new PlantUmlComponentPort(
                                        port._key,
                                        port,
                                    );
                                    plantComponent.children.push(plantPort);
                                }
                            }
                        }
                    }
                }
            }
        }
        const relations = pres.get('relations');
        if (relations.value) {
            for (const relation of relations.value as any) {
                const plantRel = new PlantUmlRelation(
                    relation.src.value._key,
                    relation.dest.value._key,
                    relation.type,
                    relation.props?.description,
                );
                presObj.children.push(plantRel);
            }
        }
    }

    protected get header(): string {
        return `
        @startuml
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
        
        AddElementTag("fallback", $bgColor="#c0c0c0")
        AddRelTag("fallback", $textColor="#c0c0c0", $lineColor="#438DD5")
        AddElementTag("deploymentGroup", $bgColor="#abd9ff")
        AddElementTag("deployment", $shadowing = true)
        AddElementTag("server", $shadowing = true, $bgColor="#e6e6e6")
        AddElementTag("kubernetesCluster", $shadowing = true)

        
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
