import {type NextRequest, NextResponse} from "next/server"
import {projects} from "@/lib/projectData"
import {getRouteStatus} from "@/lib/utils"

export async function GET(request: NextRequest) {
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

    try {
        const status = await getRouteStatus(projectSlug, route)

        return NextResponse.json({
            project: projectSlug,
            route: routePath,
            status: status.currentStatus,
            uptime: status.uptime,
            lastChecked: status.lastChecked,
            recentLogs: status.statusLogs.slice(0, 10), // newest-first
        })
    } catch (err) {
        return NextResponse.json({
            error: "Failed to fetch status",
            details: err instanceof Error ? err.message : String(err)
        }, {status: 500})
    }
}
