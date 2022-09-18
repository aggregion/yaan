import { PlantUmlObject } from './plantUmlObject';
import {
    Server,
    ServerCpu,
    ServerDisk,
    ServerFirewallPortsRule,
    ServerFirewallRule,
} from '../../yaan/schemas/server';
import { escapeStr } from './helpers';

export class PlantUmlServer extends PlantUmlObject {
    constructor(
        public readonly id: string,
        public readonly server: Server,
        public readonly showDetails: boolean,
    ) {
        super(id);
    }

    private renderCpus() {
        if (!this.showDetails) {
            return '';
        }
        if (this.server.hardware?.cpus) {
            const cpusStr = this.server.hardware?.cpus
                .map(
                    (cpu: ServerCpu, i: number) => `
                Deployment_Node("${this.id}/cpus/${i}", "CPU #${i}", "${
                        cpu.model || ''
                    }", "${cpu.cores ? cpu.cores + ' cores' : ''}"){
                }
            `,
                )
                .join('\n');
            return `
            Deployment_Node("${this.id}/cpus", "CPUs", "", "", "microchip"){
            ${cpusStr}
            }
            `;
        }
        return '';
    }

    private renderDisks() {
        if (!this.showDetails) {
            return '';
        }
        if (this.server.hardware?.disks) {
            const str = this.server.hardware?.disks
                .map(
                    (disk: ServerDisk, i: number) => `
                Deployment_Node("${this.id}/disks/${i}", "${
                        disk.devPath || ''
                    }", "${disk.size || ''}"){
                }
            `,
                )
                .join('\n');
            return `
            Deployment_Node("${this.id}/disks", "Disks", "", "", "hdd_o"){
            ${str}
            }
            `;
        }
        return '';
    }

    private renderFirewall() {
        if (!this.showDetails) {
            return '';
        }
        if (this.server.firewall) {
            const rules = {
                inbound: [],
                outbound: [],
            };
            const addRules = (
                portsRule: ServerFirewallPortsRule,
                rules: any[],
            ) => {
                for (const rule of Object.values(portsRule)) {
                    let portsStr;
                    let hostsStr;
                    let descStr = '';
                    if (Number.isFinite(rule)) {
                        portsStr = String(rule);
                        hostsStr = '*';
                    } else {
                        const detailedRule = rule as ServerFirewallRule;
                        descStr = escapeStr(detailedRule.description || '');
                        const ports = [];
                        if (detailedRule.ports) {
                            for (const portVal of Object.values(
                                detailedRule.ports,
                            )) {
                                if (typeof portVal === 'object') {
                                    ports.push(`${portVal.from}-${portVal.to}`);
                                } else {
                                    ports.push(portVal);
                                }
                            }
                        } else {
                            ports.push('*');
                        }
                        portsStr = ports.join(', ');
                        if (detailedRule.hosts) {
                            hostsStr = detailedRule.hosts.join(', ');
                        } else {
                            hostsStr = '*';
                        }
                    }
                    rules.push({
                        hosts: hostsStr,
                        ports: portsStr,
                        description: descStr,
                    });
                }
            };
            if (this.server.firewall.inboundPorts) {
                addRules(this.server.firewall.inboundPorts, rules.inbound);
            }
            if (this.server.firewall.outboundPorts) {
                addRules(this.server.firewall.outboundPorts, rules.outbound);
            }
            if (rules.inbound.length || rules.outbound.length) {
                return `
                Deployment_Node("${
                    this.id
                }/firewall", "Firewall", "", "", "lock"){             
                    AddProperty("Host(s)", "Port(s)")
                    ${rules.inbound
                        .map(
                            (rule: any) =>
                                `AddProperty("${rule.hosts}", "${rule.ports}")`,
                        )
                        .join('\n')}
                    Deployment_Node("${this.id}/firewall/inbound", "Inbound"){
                    }
                    AddProperty("Host(s)", "Port(s)")
                    ${rules.outbound
                        .map(
                            (rule: any) =>
                                `AddProperty("${rule.hosts}", "${rule.ports}")`,
                        )
                        .join('\n')}
                    Deployment_Node("${this.id}/firewall/outbound", "Outbound"){
                    }
                }`;
            }
        }
        return '';
    }

    private renderProps() {
        if (!this.showDetails) {
            return '';
        }
        return `
        AddProperty("Type", "${this.server.type || '-'}")
        AddProperty("OS Type", "${this.server.osType || '-'}")
        AddProperty("OS Name", "${this.server.osName || '-'}")
        AddProperty("Is pool", "${!!this.server.pool}")
        ${
            !!this.server.pool
                ? `
        AddProperty('Minimal scale', '${this.server.pool?.minScale}')
        AddProperty('Maximal scale', '${this.server.pool?.maxScale || '∞'}')`
                : ''
        }
        AddProperty("RAM", "${this.server.hardware?.memory || '-'}")
        `;
    }

    protected get header(): string {
        return `
        ${this.renderProps()}
        Deployment_Node("${this.id}", "${
            this.showDetails ? escapeStr(this.server.title) : '***'
        }", "Server", "${
            this.server.description || ''
        }", $sprite=server, $tags="server${
            !this.showDetails ? ',hidden' : ''
        }"){
          ${this.renderCpus()}
          ${this.renderDisks()}
          ${this.renderFirewall()}
        `;
    }

    protected get footer(): string {
        return '}';
    }
}
