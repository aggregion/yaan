export enum StorageProtocol {
    Other = 'other',
    S3 = 's3',
    NFS = 'nfs',
    CIFS = 'cifs',
}

/**
 * Storage specification
 */
export interface Storage {
    /**
     * Human-readable storage name
     */
    title: string;

    /**
     * Storage description
     */
    description?: string;

    /**
     * Protocol
     */
    protocol: StorageProtocol;

    /**
     * IP addresses or hostnames
     */
    hosts?: string[];

    /**
     * Provider
     */
    provider?: string;
}
