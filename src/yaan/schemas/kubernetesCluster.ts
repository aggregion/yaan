export interface KubernetesClusterServer {
    type: 'worker' | 'master';
}

export interface KubernetesClusterStorageClass {
    name: string;
    storage?: string;
}

export interface KubernetesCluster {
    title: string;
    description?: string;
    distribution?: string;
    version?: string;
    servers: Record<string, KubernetesClusterServer>;
    storageClasses?: string[];
}
