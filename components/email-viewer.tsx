"use client"

/**
 * Email viewer component
 * Displays full email content with sanitized HTML
 */

import {useEffect, useMemo, useState} from "react"
import {format} from "date-fns"
import {Card} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Download, Paperclip} from "lucide-react"
import {EmailAddress, EmailAttachment, EmailDetail, EmailViewerProps} from "@/types";
import {Cache} from "@/lib/cache"
import {formatPlainText} from "@/lib/text-formatter"
import {CacheSettings, EmailDisplaySettings} from "@/lib/settings"

export function EmailViewer({accountId, folder, uid}: EmailViewerProps) {
    const [email, setEmail] = useState<EmailDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadEmail() {
            setLoading(true)
            setError(null)

            try {
                // Try to get from cache first
                const cacheKey = `email:${accountId}:${folder}:${uid}`
                const cached = Cache.get<EmailDetail>(cacheKey)

                if (cached) {
                    console.log(`[EmailViewer] Using cached email`)
                    setEmail(cached)
                    setLoading(false)
                    return
                }

                const response = await fetch(`/api/accounts/${accountId}/emails/${uid}?folder=${encodeURIComponent(folder)}`)

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error("Failed to load email:", response.status, errorText)
                    setError(`Failed to load email (${response.status})`)
                    setLoading(false)
                    return
                }

                const data = await response.json()

                if (!data.email) {
                    setError("Email data is missing")
                    setLoading(false)
                    return
                }

                // Cache for 10 minutes (emails don't change often)
                Cache.set(cacheKey, data.email, CacheSettings.client.email)

                setEmail(data.email)
                setLoading(false)
            } catch (err) {
                console.error("Failed to load email", err)
                setError(err instanceof Error ? err.message : "An error occurred")
                setLoading(false)
            }
        }

        loadEmail().catch(console.error)
    }, [accountId, folder, uid])

    // Auto-detect best view mode
    const defaultTab = useMemo(() => {
        if (!email) return EmailDisplaySettings.defaultView

        // If only text exists, use text
        if (email.text && !email.html) return "text"

        // If only HTML exists, use html
        if (email.html && !email.text) return "html"

        // If both exist, check if HTML is significantly different from plain text
        if (email.html && email.text) {
            const htmlLength = email.html.length
            const textLength = email.text.length

            // If HTML is much longer (has formatting), prefer HTML
            // If they're similar length, the HTML might just be wrapped text, prefer plain
            if (htmlLength > textLength * 1.5) {
                return "html"
            }

            // Check if HTML contains significant formatting
            const hasFormatting = email.html.includes('<table') ||
                email.html.includes('<img') ||
                email.html.includes('<div') ||
                email.html.includes('<style')

            return hasFormatting ? "html" : "text"
        }

        return EmailDisplaySettings.defaultView
    }, [email])

    async function downloadAttachment(att: EmailAttachment) {
        try {
            const response = await fetch(
                `/api/accounts/${accountId}/emails/${uid}/attachments/${att.partId}?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(att.filename || 'attachment')}`
            )

            if (!response.ok) {
                console.error("Failed to download attachment")
                return
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = att.filename || 'attachment'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error("Error downloading attachment:", error)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <Separator/>
                    <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!email && !loading) {
        return (
            <div className="p-8 text-center">
                <div className="text-destructive mb-2">Failed to load email</div>
                {error && <div className="text-sm text-muted-foreground">{error}</div>}
            </div>
        )
    }

    if (!email) {
        return null
    }

    function formatAddress(addr?: EmailAddress[]): string {
        if (!addr || addr.length === 0) return "Unknown"
        return addr.map((a) => {
            if (EmailDisplaySettings.showEmailAddresses && a.name && a.address) {
                return `${a.name} <${a.address}>`
            }
            return a.name || a.address || "Unknown"
        }).join(", ")
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">{email.subject || "(No subject)"}</h1>

                <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-16">From:</span>
                        <span className="font-medium">{formatAddress(email.from)}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-16">To:</span>
                        <span>{formatAddress(email.to)}</span>
                    </div>
                    {email.cc && email.cc.length > 0 && (
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-16">CC:</span>
                            <span>{formatAddress(email.cc)}</span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-16">Date:</span>
                        <span>{email.date ? format(new Date(email.date), EmailDisplaySettings.dateFormat) : "Unknown"}</span>
                    </div>
                </div>

                {email.hasAttachments && (email.attachments ?? []).length > 0 && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {(email.attachments ?? []).map((att, i) => (
                            <Button
                                key={i}
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                                onClick={() => downloadAttachment(att)}
                            >
                                <Paperclip className="h-3 w-3"/>
                                <span>{att.filename || "Attachment"}</span>
                                {att.size && <span className="text-xs">({(att.size / 1024).toFixed(1)} KB)</span>}
                                <Download className="h-3 w-3 ml-1"/>
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <Separator className="my-6"/>

            <Tabs defaultValue={defaultTab}>
                {email.html && email.text && (
                    <TabsList className="mb-4">
                        <TabsTrigger value="html">HTML</TabsTrigger>
                        <TabsTrigger value="text">Plain Text</TabsTrigger>
                    </TabsList>
                )}

                {email.html && (
                    <TabsContent value="html">
                        <Card className="p-6">
                            <div
                                className="prose prose-sm max-w-none email-content"
                                dangerouslySetInnerHTML={{__html: email.html}}
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}
                            />
                            <style jsx>{`
                                .email-content :global(*) {
                                    color: inherit !important;
                                }

                                .email-content :global(a) {
                                    color: #3b82f6 !important;
                                    text-decoration: underline;
                                }

                                .email-content :global([style*="background"]) {
                                    background: transparent !important;
                                }

                                .email-content :global([style*="color: white"]),
                                .email-content :global([style*="color:#fff"]),
                                .email-content :global([style*="color: #fff"]),
                                .email-content :global([style*="color:#ffffff"]),
                                .email-content :global([style*="color: #ffffff"]) {
                                    color: inherit !important;
                                }
                            `}</style>
                        </Card>
                    </TabsContent>
                )}

                {email.text && (
                    <TabsContent value="text">
                        <Card className="p-6">
                            <div
                                className="whitespace-pre-wrap font-sans text-sm prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{__html: formatPlainText(email.text)}}
                            />
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}

