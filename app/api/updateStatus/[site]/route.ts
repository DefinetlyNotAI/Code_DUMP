import {NextResponse} from "next/server"
import {projects} from "@/lib/projects-data"
import {getProjectRoutes, insertStatusLog, validateProjectExists} from "@/lib/utils"

export async function POST({params}: { params: Promise<{ site: string }> }) {
    try {
        const {site} = await params

        // Validate that the site exists in our data
        if (!validateProjectExists(site)) {
            return NextResponse.json({error: "Site not found in monitoring data"}, {status: 404})
        }

        const project = projects.find((p) => p.slug === site)
        if (!project) {
            return NextResponse.json({error: "Project not found"}, {status: 404})
        }

        const routes = getProjectRoutes(site)
        const results = []

        console.log(`[v0] Updating all statuses for site: ${site}`)

        // Check each route and log the status
        for (const routePath of routes) {
            try {
                const targetUrl = `${project.visitLink}${routePath}`
                const startTime = Date.now()

                const response = await fetch(targetUrl, {
                    method: "GET",
                    headers: {
                        "User-Agent": "Website-Monitor/1.0",
                    },
                    signal: AbortSignal.timeout(10000),
                })

                const responseTime = Date.now() - startTime

                // Insert status log into database
                await insertStatusLog(site, routePath, response.status)

                results.push({
                    route: routePath,
                    statusCode: response.status,
                    responseTime,
                    success: response.ok,
                })

                console.log(`[v0] Checked ${routePath}: ${response.status} (${responseTime}ms)`)
            } catch (error) {
                // Log error status (0 for connection errors)
                await insertStatusLog(site, routePath, 0)

                results.push({
                    route: routePath,
                    statusCode: 0,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                })

                console.log(`[v0] Error checking ${routePath}:`, error)
            }
        }

        return NextResponse.json({
            message: `Updated ${results.length} routes for ${site}`,
            site,
            timestamp: new Date().toISOString(),
            results,
        })
    } catch (error) {
        console.error("[v0] Error in updateStatus:", error)
        return NextResponse.json(
            {
                error: "Failed to update status",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            {status: 500},
        )
    }
}
