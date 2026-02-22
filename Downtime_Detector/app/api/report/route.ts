import {type NextRequest, NextResponse} from "next/server"
import {projects} from "@/lib/projectData"
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

            // Determine whether we'll log this response (skip auth/method-related statuses)
            const willLog = ![401, 403, 405].includes(response.status)
            if (willLog) {
                try {
                    console.log('[API] report: inserting log for', projectSlug + routePath, 'status=', response.status, 'responseTime=', responseTime)
                    await insertStatusLog(projectSlug, routePath, response.status, responseTime)
                    console.log('[API] report: insert successful for', projectSlug + routePath)
                } catch (e) {
                    console.error('[API] report: insert failed for', projectSlug + routePath, ':', e)
                }
            } else {
                console.log('[API] report: skipping insert for', projectSlug + routePath, 'status=', response.status)
            }

            const result: any = {
                timestamp: new Date().toISOString(),
                statusCode: response.status,
                responseTime,
                success: response.ok,
                url: targetUrl,
                // Detect if the response involved redirects
                redirected: response.redirected || (response.status >= 300 && response.status < 400),
                redirectLocation: response.headers.get("location") || undefined,
                logged: willLog,
            }

            // If status indicates an auth/method problem, return a friendly payload guiding the user
            if ([401, 403].includes(response.status)) {
                return NextResponse.json({
                    message: "Authentication required",
                    result,
                    help: "The endpoint returned an authentication error (401/403). Ensure public access or provide credentials. These errors are not stored in the status log.",
                    logged: false,
                }, {status: 200})
            }

            if (response.status === 405) {
                return NextResponse.json({
                    message: "Method not allowed",
                    result,
                    help: "The endpoint returned 405 (method not allowed). Verify the route supports GET or update the monitoring method. This is not stored in the status log.",
                    logged: false,
                }, {status: 200})
            }

            return NextResponse.json({
                message: "Manual check completed",
                result,
                logged: willLog,
            })
        } catch (error) {
            const responseTime = Date.now() - startTime

            try {
                await insertStatusLog(projectSlug, routePath, 0, responseTime)
                console.log('[API] report: insert error-log successful for', projectSlug + routePath, 'responseTime=', responseTime)
            } catch (e) {
                console.error('[API] report: failed to insert error-log for', projectSlug + routePath, ':', e)
            }

            return NextResponse.json({
                message: "Manual check completed with error",
                result: {
                    timestamp: new Date().toISOString(),
                    statusCode: 0,
                    responseTime,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                logged: true,
            })
        }
    } catch (error) {
        return NextResponse.json(
            {error: "Failed to process request", details: error instanceof Error ? error.message : "Unknown error"},
            {status: 500},
        )
    }
}
