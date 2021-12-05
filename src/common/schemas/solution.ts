export interface SolutionComponentUsageDetailed {
    /**
     * Port name of other component used to communication.
     */
    port: string;

    /**
     * Usage description like, for example "sending email notifications"
     */
    description: string;
}

export type SolutionComponentUsage =
    | string
    | Record<string, SolutionComponentUsageDetailed>;

export interface SolutionComponentVolumeDetailed {
    /**
     * Minimal size of needed volume
     */
    minSize: string;
}

export type SolutionVolume = SolutionComponentVolumeDetailed | string;

export interface SolutionPortDetailed {
    /**
     * Port number
     */
    number: number;
    /**
     * Port description
     */
    description: string;
}

export type SolutionPort = SolutionPortDetailed | number;

export interface SolutionComponent {
    /**
     * Human readable name of component
     */
    title?: string;

    /**
     * Determines ports, exposed by component. You can use simple record like "api: 80" or use detailed description.
     */
    ports?: Record<string, SolutionPort>;

    /**
     * Determines whether the component stores state. You can use simple record like "data: /app/data" or use detailed description.
     */
    volumes?: Record<string, SolutionVolume>;

    /**
     * Determines how the current component is associated with others.
     */
    uses?: SolutionComponentUsage[];

    /**
     * Kind of component like: db, queue, etc.
     */
    kind?: string;
}

export interface Solution {
    /**
     * Solution components like services, databases, queues etc.
     */
    components?: Record<string, SolutionComponent>;
}
