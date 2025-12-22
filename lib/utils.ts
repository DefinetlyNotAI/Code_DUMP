import {projects} from "./projects-data"
import type {ProjectStatus, Route, RouteStatus, StatusLog} from "./types"
import {dbPool} from "./db"

// Helpers to work with the projects list and a Postgres status_logs table

export function validateProjectExists(slug: string): boolean {
    return projects.some((p) => p.slug === slug)
}

export function getProjectRoutes(slug: string): string[] {
    const project = projects.find((p) => p.slug === slug)
    if (!project) return []
    return project.routes.map((r) => r.path)
}

function ensureDb() {
    if (!process.env.POSTGRES_URL) throw new Error("POSTGRES_URL not configured; DB required for utils operations")
    if (!dbPool) throw new Error("Database pool not initialized")
}

export async function insertStatusLog(projectSlug: string, routePath: string, statusCode: number) {
    ensureDb()

    // Insert a single row into status_logs. Rely on DB schema for timestamps.
    const q = `INSERT INTO status_logs (project_slug, route_path, status_code)
               VALUES ($1, $2, $3)`
    await dbPool.query(q, [projectSlug, routePath, statusCode])
}

// Read recent logs for a route. Returns last N records ordered newest-first
export async function getRecentRouteLogs(projectSlug: string, routePath: string, limit = 20): Promise<StatusLog[]> {
    ensureDb()

    const q = `SELECT created_at, status_code
               FROM status_logs
               WHERE project_slug = $1
                 AND route_path = $2
               ORDER BY created_at DESC
               LIMIT $3`
    const res = await dbPool.query(q, [projectSlug, routePath, limit])

    // Map rows to StatusLog[] (newest first)
    return res.rows.map((r: any) => ({timestamp: new Date(r.created_at), statusCode: Number(r.status_code)}))
}

// Determine route status from recent logs
function determineStatusFromLogs(logs: StatusLog[]): {
    currentStatus: RouteStatus['currentStatus'];
    uptime: number;
    lastChecked: Date | null
} {
    if (!logs || logs.length === 0) return {currentStatus: "unknown", uptime: 0, lastChecked: null}
    const lastChecked = logs[0].timestamp

    // Uptime = percentage of non-error (200-399) statuses in logs
    const total = logs.length
    const upCount = logs.filter((l) => l.statusCode >= 200 && l.statusCode < 400).length
    const uptime = Math.round((upCount / total) * 100)

    const hasServerErrors = logs.some((l) => l.statusCode >= 500)
    const hasConnectionErrors = logs.some((l) => l.statusCode === 0)
    const hasClientErrors = logs.some((l) => l.statusCode >= 400 && l.statusCode < 500)

    let currentStatus: RouteStatus['currentStatus'] = "working"
    if (hasConnectionErrors || hasServerErrors) currentStatus = "broken"
    else if (hasClientErrors || uptime < 90) currentStatus = "degraded"

    return {currentStatus, uptime, lastChecked}
}

export async function getRouteStatus(projectSlug: string, route: Route): Promise<RouteStatus> {
    const logs = await getRecentRouteLogs(projectSlug, route.path, 20)

    const {currentStatus, uptime, lastChecked} = determineStatusFromLogs(logs)

    return {
        path: route.path,
        title: route.title,
        description: route.description,
        currentStatus,
        uptime,
        lastChecked,
        statusLogs: logs,
    }
}

export async function getProjectStatus(projectSlug: string, routes: Route[]): Promise<ProjectStatus> {
    const routeStatuses = await Promise.all(routes.map((r) => getRouteStatus(projectSlug, r)))

    // Determine overall status: worst status among routes
    const statusOrder: Record<RouteStatus['currentStatus'] | ProjectStatus['overallStatus'], number> = {
        working: 0,
        degraded: 1,
        broken: 2,
        unknown: 3,
    }

    const worst = routeStatuses.reduce<ProjectStatus['overallStatus']>((acc: ProjectStatus['overallStatus'], rs: RouteStatus) => {
        return statusOrder[rs.currentStatus] > statusOrder[acc] ? rs.currentStatus : acc
    }, "working")

    return {
        slug: projectSlug,
        overallStatus: worst,
        routeStatuses,
    }
}
