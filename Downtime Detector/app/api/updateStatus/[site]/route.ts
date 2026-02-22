import {type NextRequest, NextResponse} from "next/server"
import {projects} from "@/lib/projectData"
import {getProjectRoutes, insertStatusLog, validateProjectExists} from "@/lib/utils"

export async function POST(_request: NextRequest, context: { params: Promise<{ site: string }> }) {
    try {
        const {site} = await context.params

        // Validate that the site exists in our data
        if (!validateProjectExists(site)) {
            return NextResponse.json({error: "Site not found in monitoring data"}, {status: 404})
        }

        const project = projects.find((p) => p.slug === site)
        if (!project) {
            return NextResponse.json({error: "Project not found"}, {status: 404})
        }

        const routes = getProjectRoutes(site)
        // Split routes into static and dynamic (placeholder) routes.
        // Dynamic routes contain '[' (e.g. /api/items/[id]) and need real params to be checked.
        const staticRoutes = routes.filter((r) => !r.includes("["))
        const dynamicRoutes = routes.filter((r) => r.includes("["))
        const results = []

        // For dynamic routes, don't attempt to fetch placeholder URLs; mark as skipped.
        for (const routePath of dynamicRoutes) {
            results.push({
                route: routePath,
                statusCode: -1,
                responseTime: 0,
                success: false,
                error: "dynamic route skipped (requires concrete params)",
                logged: false,
            })
            console.log(`[API] Skipping dynamic route ${routePath} for site ${site}`)
        }

        console.log(`[API] Updating all statuses for site: ${site}`)

        // Check each static route and log the status
        for (const routePath of staticRoutes) {
            const startTime = Date.now()
            try {
                const targetUrl = `${project.visitLink}${routePath}`

                const response = await fetch(targetUrl, {
                    method: "GET",
                    headers: {
                        "User-Agent": "Website-Monitor/1.0",
                    },
                    signal: AbortSignal.timeout(10000),
                })

                const responseTime = Date.now() - startTime

                // Determine whether we log this route
                const willLog = ![401, 403, 405].includes(response.status)
                if (willLog) {
                    await insertStatusLog(site, routePath, response.status, responseTime)
                }

                results.push({
                    route: routePath,
                    statusCode: response.status,
                    responseTime,
                    success: response.ok,
                    methodMismatch: response.status === 405,
                    redirected: response.redirected || (response.status >= 300 && response.status < 400),
                    redirectLocation: response.headers.get("location") || undefined,
                    logged: willLog,
                })

                console.log(`[API] Checked ${routePath}: ${response.status} (${responseTime}ms)`)
            } catch (error) {
                const responseTime = Date.now() - startTime

                // Log error status (0 for connection errors) and ensure responseTime is stored
                let insertSucceeded = false
                try {
                    await insertStatusLog(site, routePath, 0, responseTime)
                    insertSucceeded = true
                } catch (e) {
                    console.error(`[API] Failed to insert error log for ${routePath}:`, e)
                }

                results.push({
                    route: routePath,
                    statusCode: 0,
                    responseTime,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                    logged: insertSucceeded,
                })

                console.log(`[API] Error checking ${routePath}:`, error)
            }
        }

        return NextResponse.json({
            message: `Updated ${results.length} routes for ${site}`,
            site,
            timestamp: new Date().toISOString(),
            results,
        })
    } catch (error) {
        console.error("[API] Error in updateStatus:", error)
        return NextResponse.json(
            {
                error: "Failed to update status",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            {status: 500},
        )
    }
}
