// noinspection HtmlRequiredLangAttribute

import {ExternalLink} from "lucide-react"

interface ProjectPreviewProps {
    url: string
    title: string
    renderUrl?: string
}

export async function ProjectPreview({url, title, renderUrl}: ProjectPreviewProps) {
    let htmlContent = ""
    let error = false

    // Use renderUrl if provided, otherwise use the regular url
    const urlToFetch = renderUrl || url

    try {
        const response = await fetch(urlToFetch, {
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
            // Use iterative replacement to handle nested or overlapping patterns
            let previousHtml = ''
            while (previousHtml !== html) {
                previousHtml = html
                html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                html = html.replace(/<script[^>]*>/gi, '')
            }

            // Remove noscript tags (they're not needed in a static preview)
            previousHtml = ''
            while (previousHtml !== html) {
                previousHtml = html
                html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
            }

            // Remove preload links for scripts (since we removed the scripts)
            html = html.replace(/<link[^>]*rel\s*=\s*["']?preload["'][^>]*as\s*=\s*["']?script["'][^>]*>/gi, '')
            html = html.replace(/<link[^>]*as\s*=\s*["']?script["'][^>]*rel\s*=\s*["']?preload["'][^>]*>/gi, '')

            // Remove modulepreload links as well
            html = html.replace(/<link[^>]*rel\s*=\s*["']?modulepreload["'][^>]*>/gi, '')

            // Remove inline event handlers (onclick, onload, onerror, etc.)
            // Use iterative replacement to handle overlapping patterns like "ononclick"
            previousHtml = ''
            while (previousHtml !== html) {
                previousHtml = html
                html = html.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, ' ')
                html = html.replace(/\son\w+\s*=\s*[^\s>]+/gi, ' ')
            }

            // Remove javascript: URIs
            previousHtml = ''
            while (previousHtml !== html) {
                previousHtml = html
                html = html.replace(/\s(href|src|action|formaction|data)\s*=\s*["']?\s*javascript:/gi, ' data-blocked-$1="javascript:')
            }

            // Remove data: URIs that could contain HTML/SVG with scripts
            previousHtml = ''
            while (previousHtml !== html) {
                previousHtml = html
                html = html.replace(/\s(href|src|action|formaction)\s*=\s*["']?\s*data:text\/html/gi, ' data-blocked-$1="data:text/html')
            }

            // Remove potentially dangerous tags (object, embed, applet)
            previousHtml = ''
            while (previousHtml !== html) {
                previousHtml = html
                html = html.replace(/<(object|embed|applet)[\s\S]*?<\/\1>/gi, '')
                html = html.replace(/<(object|embed|applet)[^>]*>/gi, '')
            }

            // Remove existing CSP meta tags that might conflict
            html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?Content-Security-Policy["']?[^>]*>/gi, '')

            // Get the base URL (in case of redirects, use the final URL)
            const baseUrl = new URL(response.url)
            // Use the full origin with trailing slash to ensure all resources load correctly
            const baseHref = baseUrl.origin + '/'

            // Helper function to escape HTML attributes
            const escapeHtmlAttr = (str: string) => {
                return str
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
            }

            // Inject base tag, CSP meta tag (blocking all scripts), and no-scroll style in the head
            const baseTag = `<base href="${escapeHtmlAttr(baseHref)}">`
            const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src *; script-src 'none'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; connect-src * data: blob:;">`
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
        <div className="relative w-full h-48 overflow-hidden bg-muted rounded-lg border border-border">
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
