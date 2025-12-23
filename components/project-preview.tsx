// noinspection HtmlRequiredLangAttribute

import {ExternalLink} from "lucide-react"
import {JSDOM} from "jsdom"
import createDOMPurify from "dompurify"

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

            // Use DOMPurify for proper HTML sanitization
            const window = new JSDOM('').window
            const DOMPurify = createDOMPurify(window as any)

            // Configure DOMPurify to be strict but allow necessary elements
            html = DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'html', 'head', 'body', 'title', 'meta', 'link', 'style',
                    'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
                    'header', 'footer', 'nav', 'section', 'article', 'aside', 'main',
                    'form', 'input', 'button', 'label', 'select', 'option', 'textarea',
                    'strong', 'em', 'b', 'i', 'u', 'small', 'mark', 'del', 'ins', 'sub', 'sup',
                    'br', 'hr', 'pre', 'code', 'blockquote', 'figure', 'figcaption',
                    'video', 'audio', 'source', 'track', 'canvas', 'svg', 'path', 'circle',
                    'rect', 'line', 'polyline', 'polygon', 'g', 'text', 'tspan'
                ],
                ALLOWED_ATTR: [
                    'href', 'src', 'alt', 'title', 'class', 'id', 'style', 'width', 'height',
                    'data-*', 'aria-*', 'role', 'rel', 'target', 'type', 'name', 'value',
                    'placeholder', 'disabled', 'readonly', 'checked', 'selected',
                    'colspan', 'rowspan', 'cellpadding', 'cellspacing', 'border',
                    'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'transform',
                    'xmlns', 'xmlns:xlink', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
                    'x1', 'x2', 'y1', 'y2', 'points'
                ],
                FORBID_TAGS: ['script', 'noscript', 'object', 'embed', 'applet', 'iframe', 'base'],
                FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
                ALLOW_DATA_ATTR: true,
                ALLOW_ARIA_ATTR: true,
                WHOLE_DOCUMENT: true,
                RETURN_DOM: false,
                RETURN_DOM_FRAGMENT: false,
                SANITIZE_DOM: true,
                KEEP_CONTENT: true,
                IN_PLACE: false
            })

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
                />
            )}
        </div>
    )
}
