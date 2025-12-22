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
  html,body { height:100%; margin:0; font-family:system-ui,Segoe UI,Roboto,Arial; }
  #frame { width:100%; height:100vh; border:0; display:none }
  #loader { display:flex; align-items:center; justify-content:center; flex-direction:column; height:100vh; gap:12px; color:#666; }
  #error { display:none; flex-direction:column; align-items:center; justify-content:center; height:100vh; gap:12px; color:#666; padding:20px; text-align:center; }
  #error a { color:#0066cc; text-decoration:none; }
  #error a:hover { text-decoration:underline; }
  .spinner { width:24px; height:24px; border:3px solid #ddd; border-top-color:#666; border-radius:50%; animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>
</head>
<body>
<div id="loader">
  <div class="spinner"></div>
  <div>Loading preview…</div>
</div>
<div id="error">
  <div style="font-size:32px;opacity:0.3;">⚠</div>
  <div style="font-size:14px;font-weight:500;">Preview Unavailable</div>
  <div style="font-size:12px;">This site cannot be displayed in a preview frame.</div>
  <a href="${currentUrl}" target="_blank" rel="noopener noreferrer" style="font-size:12px;">Open in new tab →</a>
</div>
<iframe id="frame" src="${currentUrl}" sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups"></iframe>
<script>
  const iframe = document.getElementById('frame');
  const loader = document.getElementById('loader');
  const errorDiv = document.getElementById('error');
  let handled = false;
  
  const onLoaded = () => {
    if (handled) return; 
    handled = true;
    loader.style.display = 'none';
    errorDiv.style.display = 'none';
    iframe.style.display = 'block';
  };
  
  const onError = () => {
    if (handled) return;
    handled = true;
    loader.style.display = 'none';
    iframe.style.display = 'none';
    errorDiv.style.display = 'flex';
  };
  
  iframe.addEventListener('load', onLoaded);
  iframe.addEventListener('error', onError);
  
  // Fallback timeout - show error if not loaded within timeout
  setTimeout(() => {
    if (handled) return; 
    handled = true;
    loader.style.display = 'none';
    iframe.style.display = 'none';
    errorDiv.style.display = 'flex';
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
