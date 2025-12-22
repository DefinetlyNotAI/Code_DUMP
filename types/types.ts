type RouteReplacement = [item: string, replacement: string];

interface Route {
    path: string
    title: string
    description: string
    valueReplacement?: RouteReplacement[]
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
    currentStatus: "working" | "degraded" | "broken" | "unknown"
    uptime: number
    lastChecked: Date | null
    statusLogs: StatusLog[]
}
