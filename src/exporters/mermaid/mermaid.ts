import { ProjectContainer } from '../../yaan/types';
import { MermaidC4Diagram } from './mermaidC4Diagram';
import { MermaidComponent } from './mermaidComponent';
import { MermaidRel } from './mermaidRel';
import { Solution, SolutionComponent } from '../../yaan/schemas/solution';
import { MermaidComponentDb } from './mermaidComponentDb';
import { MermaidComponentQueue } from './mermaidComponentQueue';
import { MermaidBoundary } from './mermaidBoundary';
import { MermaidNothing } from './mermaidNothing';
import { MermaidContainer } from './mermaidContainer';
import { MermaidObject } from './mermaidObject';
import { MermaidContainerDb } from './mermaidContainerDb';
import { MermaidContainerQueue } from './mermaidContainerQueue';

export interface ExportComponentWithRelationsOptions {
    useBoundary?: boolean;
    generateLinks?: boolean;
}

export class MermaidExporter {
    constructor(private readonly project: ProjectContainer) {}

    public exportSolution(solution: string) {
        const sol = this.project.solutions.get(solution);
        if (!sol) {
            throw new Error(`Solution not found: ${solution}`);
        }
        const groups: Record<
            string,
            { mGroup: MermaidObject; components: string[] }
        > = {};
        const groupedComponentsSet = new Set<string>();
        const getFigureByKind = (kind: string | undefined) => {
            if (kind) {
                switch (kind) {
                    case 'db':
                        return MermaidContainerDb;
                        break;
                    case 'queue':
                        return MermaidContainerQueue;
                        break;
                }
            }
            return MermaidContainer;
        };
        if (sol.groups) {
            for (const [groupName, group] of Object.entries(sol.groups)) {
                let Figure = MermaidContainer;
                const kinds = Array.from(
                    new Set(
                        group.components.map((c) => sol.components[c]?.kind),
                    ),
                );
                if (kinds.length === 1 && kinds[0]) {
                    Figure = getFigureByKind(kinds[0]);
                }
                const mGroup = new Figure(
                    groupName,
                    group.title,
                    Array.from(
                        new Set(
                            group.components
                                .map((c) => sol.components[c]?.technology)
                                .filter((t) => t),
                        ),
                    ).join(', '),
                );
                groups[groupName] = {
                    mGroup,
                    components: group.components,
                };
                group.components.forEach((c) => groupedComponentsSet.add(c));
            }
        }
        const ungroupedComponents = Object.keys(sol.components).filter(
            (c) => !groupedComponentsSet.has(c),
        );
        ungroupedComponents.forEach((uc) => {
            const n = 'group' + uc;
            const comp = sol.components[uc];
            if (comp) {
                const Figure = getFigureByKind(comp.kind);
                groups[n] = {
                    mGroup: new Figure(
                        n,
                        comp.title,
                        comp.technology || comp.kind,
                        comp.description,
                    ),
                    components: [uc],
                };
            }
        });
        const diagram = new MermaidC4Diagram(sol.title);
        const containers = new MermaidNothing();
        const rels = new MermaidNothing();
        diagram.children.push(containers, rels);
        for (const [groupName, group] of Object.entries(groups)) {
            containers.children.push(group.mGroup);
            const usingGroups: Record<
                string,
                {
                    titles: string[];
                    technologies: string[];
                }
            > = {};
            for (const compName of group.components) {
                const comp = sol.components[compName];
                if (!comp) {
                    throw new Error(`Component not found: ${compName}`);
                }
                const relations = MermaidExporter.getComponentRelations(
                    sol,
                    compName,
                );
                relations.usingOf.forEach((rel) => {
                    const foundGroup = Object.entries(groups).find(
                        ([, v]) => v.components.indexOf(rel.to) !== -1,
                    );
                    if (!foundGroup || foundGroup[0] === groupName) {
                        return;
                    }
                    const toName = foundGroup[0];
                    let ug = usingGroups[toName];
                    if (!ug) {
                        ug = usingGroups[toName] = {
                            titles: [],
                            technologies: [],
                        };
                    }
                    if (rel.title) {
                        ug.titles.push(rel.title);
                    }
                    if (rel.technology) {
                        ug.technologies.push(rel.technology);
                    }
                });
            }
            for (const [gName, g] of Object.entries(usingGroups)) {
                rels.children.push(
                    new MermaidRel(
                        groupName,
                        gName,
                        Array.from(new Set(g.titles)).join('; '),
                        Array.from(new Set(g.technologies)).join(', '),
                    ),
                );
            }
        }
        return diagram.print();
    }

    public exportSolutionDetailed(solution: string) {
        const sol = this.project.solutions.get(solution);
        if (!sol) {
            throw new Error(`Solution not found: ${solution}`);
        }
        const diagram = new MermaidC4Diagram(sol.title);
        const comps = [];
        const rels = [];
        for (const [compName, comp] of Object.entries(sol.components)) {
            const mComp = MermaidExporter.getComponentFigure(
                compName,
                comp,
                false,
                `#comp-${compName}`,
            );
            comps.push(mComp);
            if (comp.uses) {
                for (const usage of comp.uses) {
                    if (typeof usage === 'string') {
                        rels.push(new MermaidRel(compName, usage));
                    } else {
                        rels.push(
                            new MermaidRel(
                                compName,
                                usage.name,
                                usage.description,
                                usage.protocol,
                            ),
                        );
                    }
                }
            }
        }
        diagram.children.push(...comps);
        diagram.children.push(...rels);
        return diagram.print();
    }

    public exportComponentWithRelations(
        solution: string,
        component: string,
        options?: ExportComponentWithRelationsOptions,
    ) {
        const sol = this.project.solutions.get(solution);
        if (!sol) {
            throw new Error(`Solution not found: ${solution}`);
        }
        const diagram = new MermaidC4Diagram();
        const comp = sol.components[component];
        if (!comp) {
            throw new Error(`Component not found: ${component}`);
        }
        const mComp = MermaidExporter.getComponentFigure(
            component,
            comp,
            false,
            `#comp-${component}`,
        );
        let mainGroup;
        let usedByGroup: MermaidObject;
        let usingGroup: MermaidObject;
        if (options?.useBoundary) {
            mainGroup = new MermaidBoundary('mainBoundary');
            mainGroup.transparent = true;
            const ub = new MermaidBoundary('usedByBoundary');
            ub.transparent = true;
            usedByGroup = ub;
            const ug = new MermaidBoundary('usingBoundary');
            ug.transparent = true;
            usingGroup = ug;
        } else {
            mainGroup = new MermaidNothing();
            usedByGroup = new MermaidNothing();
            usingGroup = new MermaidNothing();
        }
        mainGroup.children.push(mComp);
        const allRelations = MermaidExporter.getComponentRelations(
            sol,
            component,
        );
        allRelations.usingOf.forEach((rel) => {
            usingGroup.children.push(
                MermaidExporter.getComponentFigure(
                    rel.to,
                    sol.components[rel.to],
                    false,
                    `#comp-${rel.to}`,
                ),
            );
        });
        allRelations.usedBy.forEach((rel) => {
            usedByGroup.children.push(
                MermaidExporter.getComponentFigure(
                    rel.from,
                    sol.components[rel.from],
                    false,
                    `#comp-${rel.from}`,
                ),
            );
        });
        const relations = [...allRelations.usingOf, ...allRelations.usedBy];
        if (usedByGroup.children.length > 0) {
            diagram.children.push(usedByGroup);
        }
        diagram.children.push(mainGroup);
        if (usingGroup.children.length > 0) {
            diagram.children.push(usingGroup);
        }
        diagram.children.push(...relations);
        return diagram.print();
    }

    public exportGroup(solution: string, groupName: string) {
        const sol = this.project.solutions.get(solution);
        if (!sol) {
            throw new Error(`Solution not found: ${solution}`);
        }
        const group = sol.groups && sol.groups[groupName];
        if (!group) {
            throw new Error(`Group not found: ${groupName}`);
        }
        const diagram = new MermaidC4Diagram();
        const rels = new MermaidNothing();
        const comps = new MermaidNothing();
        diagram.children.push(comps, rels);
        for (const compName of group.components) {
            const comp = sol.components[compName];
            if (!comp) {
                throw new Error(`Component not found: ${comp}`);
            }
            comps.children.push(
                MermaidExporter.getComponentFigure(
                    compName,
                    comp,
                    false,
                    '#comp-' + compName,
                ),
            );
            const relations = MermaidExporter.getComponentRelations(
                sol,
                compName,
            );
            relations.usingOf.forEach((rel) => {
                if (group.components.indexOf(rel.to) !== -1) {
                    rels.children.push(rel);
                }
            });
        }
        return diagram.print();
    }

    private static getComponentRelations(sol: Solution, compName: string) {
        const comp = sol.components[compName];
        if (!comp) {
            throw new Error(`Component not found: ${compName}`);
        }
        const usedBy = [];
        const usingOf = [];

        const getPortNumber = (compName: string, portName: string) => {
            let portNumber: string | undefined = undefined;
            const comp = sol.components[compName];
            if (!comp) {
                throw new Error(
                    `Can't find component "${compName}" used by "${compName}"`,
                );
            }
            if (!comp.ports || !comp.ports[portName]) {
                throw new Error(
                    `Can't find port "${portName}" of component "${compName}"`,
                );
            }
            const port = comp.ports[portName];
            if (typeof port === 'object') {
                portNumber = port.number.toString();
            } else {
                portNumber = port.toString();
            }
            return portNumber;
        };

        if (comp.uses) {
            for (const usage of comp.uses) {
                if (typeof usage === 'string') {
                    usingOf.push(new MermaidRel(compName, usage));
                } else {
                    const portNumber = usage.port
                        ? getPortNumber(usage.name, usage.port)
                        : '';
                    usingOf.push(
                        new MermaidRel(
                            compName,
                            usage.name,
                            usage.description,
                            usage.protocol,
                            '',
                            portNumber,
                        ),
                    );
                }
            }
        }
        for (const [uCompName, uComp] of Object.entries(sol.components)) {
            if (uComp.uses) {
                for (const usage of uComp.uses) {
                    if (typeof usage === 'string') {
                        if (usage === compName) {
                            usedBy.push(new MermaidRel(uCompName, compName));
                        }
                    } else {
                        if (usage.name === compName) {
                            const portNumber = usage.port
                                ? getPortNumber(compName, usage.port)
                                : '';
                            usedBy.push(
                                new MermaidRel(
                                    uCompName,
                                    compName,
                                    usage.description,
                                    usage.protocol,
                                    '',
                                    portNumber,
                                ),
                            );
                        }
                    }
                }
            }
        }
        return { usingOf, usedBy };
    }

    private static getComponentFigure(
        id: string,
        comp: SolutionComponent,
        ext = false,
        link?: string,
    ) {
        let Figure = MermaidComponent;
        switch (comp.kind) {
            case 'db':
                Figure = MermaidComponentDb;
                break;
            case 'queue':
                Figure = MermaidComponentQueue;
                break;
        }
        const fig = new Figure(
            id,
            comp.title || id,
            comp.technology || comp.kind || '',
            comp.description,
            { link },
        );
        fig.ext = ext;
        return fig;
    }
}
