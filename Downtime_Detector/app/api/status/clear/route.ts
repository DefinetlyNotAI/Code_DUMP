import {type NextRequest, NextResponse} from "next/server"
import {projects} from "@/lib/projectData"
import {dbPool} from "@/lib/db"

export async function POST(request: NextRequest) {
    // Protect: only allow in non-production to avoid accidental deletion
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({error: "Forbidden in production"}, {status: 403})
    }

    const searchParams = request.nextUrl.searchParams
    const projectSlug = searchParams.get("project")

    if (!projectSlug) return NextResponse.json({error: "Missing project param"}, {status: 400})

    const project = projects.find((p) => p.slug === projectSlug)
    if (!project) return NextResponse.json({error: "Project not found"}, {status: 404})

    try {
        if (!dbPool) return NextResponse.json({error: "DB not initialized"}, {status: 500})

        const client = await dbPool.connect()
        try {
            await client.query(`DELETE FROM status_logs WHERE project_slug = $1`, [projectSlug])
            return NextResponse.json({message: `Cleared logs for ${projectSlug}`})
        } finally {
            client.release()
        }
    } catch (err) {
        return NextResponse.json({
            error: "Failed to clear logs",
            details: err instanceof Error ? err.message : String(err)
        }, {status: 500})
    }
}

