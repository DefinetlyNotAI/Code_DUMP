"use client"

/**
 * Email viewer component
 * Displays full email content with sanitized HTML
 */

import {useEffect, useState} from "react"
import {format} from "date-fns"
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Separator} from "@/components/ui/separator"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Paperclip} from "lucide-react"
import {EmailAddress, EmailDetail, EmailViewerProps} from "@/types";

export function EmailViewer({accountId, folder, uid}: EmailViewerProps) {
    const [email, setEmail] = useState<EmailDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadEmail() {
            setLoading(true)
            const response = await fetch(`/api/accounts/${accountId}/emails/${uid}?folder=${encodeURIComponent(folder)}`)

            if (!response.ok) {
                const error = new Error("Failed to load email")
                console.error("Failed to load email", error)
                setLoading(false)
                return
            }

            const data = await response.json()
            setEmail(data.email)
            setLoading(false)
        }

        loadEmail().catch((err) => {
            console.error("Failed to load email", err)
            setLoading(false)
        })
    }, [accountId, folder, uid])

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

    if (!email) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>Failed to load email</p>
            </div>
        )
    }

    function formatAddress(addr?: EmailAddress[]): string {
        if (!addr || addr.length === 0) return "Unknown"
        return addr.map((a) => a.name || a.address).join(", ")
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
                        <span>{email.date ? format(new Date(email.date), "PPpp") : "Unknown"}</span>
                    </div>
                </div>

                {email.hasAttachments && (email.attachments ?? []).length > 0 && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {(email.attachments ?? []).map((att, i) => (
                            <Badge key={i} variant="secondary" className="gap-1">
                                <Paperclip className="h-3 w-3"/>
                                {att.filename || "Attachment"}
                                {att.size && <span className="text-xs">({(att.size / 1024).toFixed(1)} KB)</span>}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <Separator className="my-6"/>

            <Tabs defaultValue={email.html ? "html" : "text"}>
                {email.html && email.text && (
                    <TabsList className="mb-4">
                        <TabsTrigger value="html">HTML</TabsTrigger>
                        <TabsTrigger value="text">Plain Text</TabsTrigger>
                    </TabsList>
                )}

                {email.html && (
                    <TabsContent value="html">
                        <Card className="p-6">
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: email.html}}/>
                        </Card>
                    </TabsContent>
                )}

                {email.text && (
                    <TabsContent value="text">
                        <Card className="p-6">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{email.text}</pre>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
