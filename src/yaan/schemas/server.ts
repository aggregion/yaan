export interface ServerCpu {
    cores?: number;
    model?: string;
}

export interface ServerDisk {
    size?: string;
    devPath?: string;
    customProps?: Record<string, any>;
}

export interface ServerHardware {
    cpus?: ServerCpu[];
    memory?: string;
    disks?: ServerDisk[];
}

export interface ServerFirewallPortRange {
    from: number;
    to: number;
}

export type ServerFirewallPort = number | ServerFirewallPortRange;

export interface ServerFirewallRule {
    description?: string;
    ports?: ServerFirewallPort[];
    hosts?: string[];
}

export type ServerFirewallPortsRule = Record<
    string,
    number | ServerFirewallRule
>;

export interface ServerFirewall {
    inboundPorts?: ServerFirewallPortsRule;
    outboundPorts?: ServerFirewallPortsRule;
}

export interface ServerPool {
    /**
     * Minimum scale factor
     */
    minScale?: number;

    /**
     * Maximum scale factor
     */
    maxScale?: number;
}

export interface IPInterface {
    description?: string;
    address?: string;
    netmask?: string;
}

/**
 * Server specification
 */
export interface Server {
    /**
     * Human readable server name
     */
    title: string;

    /**
     * Server description
     */
    description?: string;

    doc?: string;

    /**
     * Organization that owns the server
     */
    owner?: string;

    /**
     * Provider that hosts the server
     */
    provider?: string;

    /**
     * Server type: virtual or dedicated
     */
    type?: 'virtual' | 'dedicated';

    /**
     * Operating system type: linux, windows etc.
     */
    osType?: string;

    /**
     * Operating system name like "Ubuntu 20.04"
     */
    osName?: string;

    /**
     * Server hardware details
     */
    hardware?: ServerHardware;

    /**
     * Determines firewall settings details. It may be not server's but gateway settings. The purpose of this description is to determine which ports / hosts are available for communication.
     */
    firewall?: ServerFirewall;

    /**
     * Determines if it is not specific server but server's pool that can be scaled automatically.
     */
    pool?: ServerPool;

    /**
     * Ip addresses or hosts
     */
    hosts?: string[];

    interfaces?: Record<string, IPInterface>;
}
