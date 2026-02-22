import {projects} from "./projectData"
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

// Wrapper to execute queries with automatic connection cleanup
async function executeQuery<T = any>(query: string, params: any[]): Promise<T> {
    ensureDb()
    const client = await dbPool.connect()
    try {
        const result = await client.query(query, params)
        return result as T
    } finally {
        // Always release the connection back to the pool
        client.release()
    }
}

export async function insertStatusLog(projectSlug: string, routePath: string, statusCode: number, responseTime?: number) {
    // Insert a single row into status_logs. Store response_time when available.
    const q = `INSERT INTO status_logs (project_slug, route_path, status_code, response_time)
               VALUES ($1, $2, $3, $4)`
    // Important: use explicit undefined check so that 0 is stored (0 is falsy, don't coerce to null)
    const dbResponseTime = responseTime === undefined ? null : responseTime

    try {
        console.log(`[DB] insertStatusLog: project=${projectSlug}, route=${routePath}, status=${statusCode}, response_time=${dbResponseTime}`)
        const res = await executeQuery(q, [projectSlug, routePath, statusCode, dbResponseTime])
        console.log('[DB] insertStatusLog: query ok, rowsAffected=', (res as any)?.rowCount ?? 'unknown')
    } catch (err) {
        console.error('[DB] insertStatusLog: query failed', err)
        throw err
    }
}

// Read recent logs for a route. Returns last N records ordered newest-first
export async function getRecentRouteLogs(projectSlug: string, routePath: string, limit = 20): Promise<StatusLog[]> {
    const q = `SELECT created_at, status_code, response_time
               FROM status_logs
               WHERE project_slug = $1
                 AND route_path = $2
               ORDER BY created_at DESC
               LIMIT $3`
    const res = await executeQuery(q, [projectSlug, routePath, limit])

    // Map rows to StatusLog[] (newest first)
    return res.rows.map((r: any) => ({
        timestamp: new Date(r.created_at),
        statusCode: Number(r.status_code),
        responseTime: r.response_time !== null ? Number(r.response_time) : undefined
    }))
}

// Determine route status from recent logs
function determineStatusFromLogs(logs: StatusLog[]): {
    currentStatus: RouteStatus['currentStatus'];
    uptime: number;
    lastChecked: Date | null
} {
    if (!logs || logs.length === 0) return {currentStatus: "unknown", uptime: 0, lastChecked: null}
    const lastChecked = logs[0].timestamp

    // Uptime = percentage of successful (200-299) statuses in logs
    const total = logs.length
    const upCount = logs.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length
    const uptime = Math.round((upCount / total) * 100)

    // Check ONLY the most recent log for current broken state
    const lastStatus = logs[0].statusCode
    const isCurrentlyBroken = lastStatus === 0 || lastStatus >= 500

    // Check the most recent log for current degraded issues
    const hasCurrentClientErrors = lastStatus >= 400 && lastStatus < 500
    const hasCurrentRedirects = lastStatus >= 300 && lastStatus < 400

    let currentStatus: RouteStatus['currentStatus'] = "working"

    if (isCurrentlyBroken) {
        currentStatus = "broken"
    }
    // Current degraded issues take priority
    else if (hasCurrentClientErrors || hasCurrentRedirects) {
        currentStatus = "degraded"
    }
    // If no current issues but uptime < 70%, mark as previous degradations
    else if (uptime < 70) {
        currentStatus = "previous-degradations"
    }

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
    // Process routes serially to avoid overwhelming the single DB connection
    const routeStatuses: RouteStatus[] = []
    for (const route of routes) {
        const status = await getRouteStatus(projectSlug, route)
        routeStatuses.push(status)
    }

    // Determine overall status: worst status among routes
    const statusOrder: Record<RouteStatus['currentStatus'] | ProjectStatus['overallStatus'], number> = {
        working: 0,
        "previous-degradations": 1,
        degraded: 2,
        broken: 3,
        unknown: 4,
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
