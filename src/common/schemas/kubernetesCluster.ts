export interface KubernetesClusterNode {
    type: 'worker' | 'master';
}

export interface KubernetesCluster {
    title: string;
    description?: string;
    nodes: Record<string, KubernetesClusterNode>;
}
