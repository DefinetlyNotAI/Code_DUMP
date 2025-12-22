// noinspection HtmlRequiredLangAttribute

import {ExternalLink} from "lucide-react"

interface ProjectPreviewProps {
    url: string
    title: string
}

export async function ProjectPreview({url, title}: ProjectPreviewProps) {
    let htmlContent = ""
    let error = false

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            signal: AbortSignal.timeout(10000),
            cache: 'no-store',
            redirect: 'follow'
        })

        if (response.ok) {
            let html = await response.text()

            // Remove script tags to make it static (no JavaScript execution)
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

            // Remove noscript tags (they're not needed in a static preview)
            html = html.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')

            // Remove preload links for scripts (since we removed the scripts)
            html = html.replace(/<link[^>]*rel=["']?preload["'][^>]*as=["']?script["'][^>]*>/gi, '')
            html = html.replace(/<link[^>]*as=["']?script["'][^>]*rel=["']?preload["'][^>]*>/gi, '')

            // Remove modulepreload links as well
            html = html.replace(/<link[^>]*rel=["']?modulepreload["'][^>]*>/gi, '')

            // Remove inline event handlers (onclick, onload, onerror, etc.)
            html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
            html = html.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')

            // Remove existing CSP meta tags that might conflict
            html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '')

            // Get the base URL (in case of redirects, use the final URL)
            const baseUrl = new URL(response.url)
            const baseHref = `${baseUrl.protocol}//${baseUrl.host}`

            // Inject base tag, CSP meta tag (blocking all scripts), and no-scroll style in the head
            const baseTag = `<base href="${baseHref}/">`
            const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline' https:; img-src * data: blob:; font-src * data:; connect-src * data: blob:;">`
            const noScrollStyle = `<style>html, body { overflow: hidden !important; }</style>`

            if (html.includes('<head>')) {
                html = html.replace(/<head>/i, `<head>${baseTag}${cspMeta}${noScrollStyle}`)
            } else if (html.includes('<html>')) {
                html = html.replace(/<html[^>]*>/i, `$&<head>${baseTag}${cspMeta}${noScrollStyle}</head>`)
            } else {
                html = `<head>${baseTag}${cspMeta}${noScrollStyle}</head>` + html
            }

            htmlContent = html
        } else {
            error = true
        }
    } catch (err) {
        error = true
    }

    return (
        <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-lg border border-border">
            {error ? (
                <div className="flex h-full items-center justify-center text-muted-foreground p-4">
                    <div className="text-center">
                        <div className="text-4xl font-bold opacity-20 mb-3">{title[0]}</div>
                        <div className="text-sm mb-3">Preview unavailable</div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                            <ExternalLink className="h-3 w-3"/>
                            Open in new tab
                        </a>
                    </div>
                </div>
            ) : (
                <iframe
                    srcDoc={htmlContent}
                    title={`Preview of ${title}`}
                    className="h-full w-full scale-[0.5] origin-top-left pointer-events-none overflow-hidden"
                    style={{width: "200%", height: "200%", overflow: "hidden"}}
                    sandbox="allow-same-origin"
                    scrolling="no"
                />
            )}
        </div>
    )
}
