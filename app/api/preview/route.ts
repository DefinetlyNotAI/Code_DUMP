import {type NextRequest, NextResponse} from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
        return NextResponse.json({error: "Missing url parameter"}, {status: 400})
    }

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Website-Monitor-Preview/1.0",
            },
            signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) {
            return NextResponse.json({error: `Failed to fetch: ${response.status}`}, {status: response.status})
        }

        let html = await response.text()

        html = html.replace(
            /<head>/i,
            `<head><base href="${url}"><style>body { pointer-events: none; user-select: none; }</style>`,
        )

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "public, max-age=300",
            },
        })
    } catch (error) {
        return NextResponse.json(
            {error: "Failed to fetch preview", details: error instanceof Error ? error.message : "Unknown error"},
            {status: 500},
        )
    }
}
