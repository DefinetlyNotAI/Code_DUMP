import {type NextRequest, NextResponse} from "next/server"
import {projects} from "@/lib/projects-data"
import {insertStatusLog} from "@/lib/utils"

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const projectSlug = searchParams.get("project")
        const routePath = searchParams.get("route")

        if (!projectSlug || !routePath) {
            return NextResponse.json({error: "Missing project or route parameter"}, {status: 400})
        }

        const project = projects.find((p) => p.slug === projectSlug)
        if (!project) {
            return NextResponse.json({error: "Project not found"}, {status: 404})
        }

        const route = project.routes.find((r) => r.path === routePath)
        if (!route) {
            return NextResponse.json({error: "Route not found"}, {status: 404})
        }

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

            await insertStatusLog(projectSlug, routePath, response.status)

            const result = {
                timestamp: new Date().toISOString(),
                statusCode: response.status,
                responseTime,
                success: response.ok,
                url: targetUrl,
            }

            return NextResponse.json({
                message: "Manual check completed",
                result,
            })
        } catch (error) {
            const responseTime = Date.now() - startTime

            await insertStatusLog(projectSlug, routePath, 0)

            return NextResponse.json({
                message: "Manual check completed with error",
                result: {
                    timestamp: new Date().toISOString(),
                    statusCode: 0,
                    responseTime,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                },
            })
        }
    } catch (error) {
        return NextResponse.json(
            {error: "Failed to process request", details: error instanceof Error ? error.message : "Unknown error"},
            {status: 500},
        )
    }
}
