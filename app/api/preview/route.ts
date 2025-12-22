import {type NextRequest, NextResponse} from "next/server"
import settings from '@/lib/settings'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
        return NextResponse.json({error: "Missing url parameter"}, {status: 400})
    }

    try {
        // We want to detect redirects and, if present, wait a configured amount before following them.
        const maxRedirects = settings.preview.maxRedirects
        let currentUrl = url
        let response: Response | null = null

        for (let i = 0; i <= maxRedirects; i++) {
            response = await fetch(currentUrl, {
                headers: {
                    "User-Agent": settings.preview.userAgent,
                },
                // don't auto-follow redirects so we can pause before following
                redirect: "manual",
                signal: AbortSignal.timeout(settings.preview.fetchTimeoutMs),
            })

            // If we hit a redirect (3xx) and have a Location header, wait then follow
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location")
                if (location) {
                    // wait configured min + jitter before following
                    const waitMs = settings.preview.redirectWaitMsMin + Math.floor(Math.random() * settings.preview.redirectWaitMsJitter)
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

        // If configured to wait for full client-side load, return an iframe wrapper that waits for load event
        if (settings.preview.waitForFullLoad) {
            const iframeHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Preview: ${currentUrl}</title>
<style>
  html,body { height:100%; margin:0 }
  #frame { width:100%; height:100vh; border:0; display:none }
  #loader { display:flex; align-items:center; justify-content:center; height:100vh; font-family:system-ui,Segoe UI,Roboto,Arial; }
</style>
</head>
<body>
<div id="loader">Loading preview…</div>
<iframe id="frame" src="${currentUrl}" sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock"></iframe>
<script>
  const iframe = document.getElementById('frame');
  const loader = document.getElementById('loader');
  let handled = false;
  const onLoaded = () => {
    if (handled) return; handled = true;
    loader.style.display = 'none';
    iframe.style.display = 'block';
  };
  iframe.addEventListener('load', onLoaded);
  // Fallback timeout
  setTimeout(() => {
    if (handled) return; handled = true;
    loader.innerText = 'Preview is taking too long to load. Showing available content.';
    iframe.style.display = 'block';
  }, ${settings.preview.waitForFullLoadTimeoutMs});
</script>
</body>
</html>`

            return new NextResponse(iframeHtml, {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': `public, max-age=${settings.preview.cacheSeconds}`,
                },
            })
        }

        let html = await response.text()

        html = html.replace(
            /<head>/i,
            `<head><base href="${currentUrl}"><style>body { pointer-events: none; user-select: none; }</style>`,
        )

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": `public, max-age=${settings.preview.cacheSeconds}`,
            },
        })
    } catch (error) {
        return NextResponse.json(
            {error: "Failed to fetch preview", details: error instanceof Error ? error.message : "Unknown error"},
            {status: 500},
        )
    }
}
