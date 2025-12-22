import {type NextRequest, NextResponse} from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
        return NextResponse.json({error: "Missing url parameter"}, {status: 400})
    }

    try {
        // We want to detect redirects and, if present, wait 3-5 seconds before following them.
        // Do a manual redirect fetch to inspect 3xx responses and Location header.
        const maxRedirects = 3
        let currentUrl = url
        let response: Response | null = null

        for (let i = 0; i <= maxRedirects; i++) {
            response = await fetch(currentUrl, {
                headers: {
                    "User-Agent": "Website-Monitor-Preview/1.0",
                },
                // don't auto-follow redirects so we can pause before following
                redirect: "manual",
                signal: AbortSignal.timeout(10000),
            })

            // If we hit a redirect (3xx) and have a Location header, wait 3-5s then follow
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location")
                if (location) {
                    // wait 3-5 seconds before following
                    const waitMs = 3000 + Math.floor(Math.random() * 2000)
                    await new Promise((res) => setTimeout(res, waitMs))

                    // Resolve relative redirects against current URL
                    try {
                        currentUrl = new URL(location, currentUrl).href
                        // Continue loop to fetch the redirected location
                        continue
                    } catch (err) {
                        return NextResponse.json({error: "Invalid redirect location"}, {status: 502})
                    }
                }
            }

            // If not a redirect, break and use this response
            break
        }

        if (!response) {
            return NextResponse.json({error: "No response received"}, {status: 502})
        }

        // If the target explicitly forbids GET (method mismatch), surface a readable message
        if (response.status === 405) {
            return new NextResponse(
                `<html lang="en"><body><h1>405 Method Not Allowed</h1><p>The requested URL ${currentUrl} returned 405. Preview is not available for non-GET endpoints.</p></body></html>`,
                {
                    headers: {"Content-Type": "text/html"},
                    status: 405,
                },
            )
        }

        if (!response.ok) {
            return NextResponse.json({error: `Failed to fetch: ${response.status}`}, {status: response.status})
        }

        let html = await response.text()

        html = html.replace(
            /<head>/i,
            `<head><base href="${currentUrl}"><style>body { pointer-events: none; user-select: none; }</style>`,
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
