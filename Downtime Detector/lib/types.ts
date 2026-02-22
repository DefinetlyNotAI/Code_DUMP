export interface Route {
    path: string
    title: string
    description: string
}

export interface Project {
    slug: string
    title: string
    description: string
    visitLink: string
    routes: Route[]
}

export interface StatusLog {
    timestamp: Date
    statusCode: number
    responseTime?: number
}

export interface RouteStatus {
    path: string
    title: string
    description: string
    currentStatus: "working" | "degraded" | "broken" | "unknown" | "previous-degradations"
    uptime: number
    lastChecked: Date | null
    statusLogs: StatusLog[]
}

export interface ProjectStatus {
    slug: string
    overallStatus: "working" | "degraded" | "broken" | "unknown" | "previous-degradations"
    routeStatuses: RouteStatus[]
}
