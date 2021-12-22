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
            pres.key,
            pres.value.presentation,
        );
        this.children.push(presObj);
        pres.get('servers').each((server) => {
            presObj.children.push(
                new PlantUmlServer(
                    server.key,
                    server.get('server').value,
                    server.get('showHardwareDetails').value,
                ),
            );
        });
        pres.get('kubernetesClusters').each((cluster) => {
            presObj.children.push(
                new PlantUmlKubernetesCluster(
                    cluster.key,
                    cluster.get('kubernetesCluster').value,
                    cluster.get('showDetails').value,
                ),
            );
        });
        pres.get('deployments').each((deployment) => {
            const plantDep = new PlantUmlDeployment(
                deployment.key,
                deployment.get('deployment').value,
                deployment.get('showDetails').value,
            );
            presObj.children.push(plantDep);
            deployment.get('groups').each((group) => {
                const plantGroup = new PlantUmlDeploymentGroup(
                    group.key,
                    group.get('deploymentGroup').value,
                    deployment.get('showDetails').value,
                );
                plantDep.children.push(plantGroup);
                group.get('components').each((component) => {
                    if (!component.value.show) {
                        return;
                    }
                    const plantComponent = new PlantUmlComponent(
                        component.key,
                        component.get('component').value,
                    );
                    plantGroup.children.push(plantComponent);
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
        pres.get('relations').each((relation) => {
            const relationVal = relation.value;
            const plantRel = new PlantUmlRelation(
                relationVal.src.key,
                relationVal.dest.key,
                relationVal.type,
                relationVal.props?.description,
            );
            presObj.children.push(plantRel);
        });
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
        AddRelTag("uses-external", $textColor="#3b52ff", $lineColor="#3b52ff", $lineStyle=BoldLine())
        AddRelTag("uses-internal", $textColor="#333333", $lineColor="#333333", $lineStyle=DashedLine())
        AddRelTag("deployed-on", $textColor="#29a300", $lineColor="#29a300", $lineStyle=DottedLine())
        AddRelTag("clustered-on", $textColor="#29a300", $lineColor="#29a300", $lineStyle=DottedLine())

        AddElementTag("deploymentGroup", $bgColor="#abd9ff")
        AddElementTag("deployment", $shadowing = true)
        AddElementTag("server", $shadowing = true, $bgColor="#e6e6e6")
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
