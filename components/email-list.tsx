"use client"

/**
 * Email list component
 * Displays paginated list of emails
 */

import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {formatDistanceToNow} from "date-fns"
import {cn} from "@/lib/utils"
import {ChevronLeft, ChevronRight, Paperclip} from "lucide-react"

interface EmailSummary {
    uid: number
    subject?: string
    from?: Array<{ name?: string; address?: string }>
    date?: string
    hasAttachments: boolean
}

interface EmailListProps {
    accountId: string
    folder: string
    selectedUid?: number
    onEmailSelect: (uid: number) => void
}

export function EmailList({accountId, folder, selectedUid, onEmailSelect}: EmailListProps) {
    const [emails, setEmails] = useState<EmailSummary[]>([])
    const [total, setTotal] = useState(0)
    const [offset, setOffset] = useState(0)
    const [loading, setLoading] = useState(true)

    const limit = 50

    useEffect(() => {
        async function loadEmails() {
            setLoading(true)
            const response = await fetch(
                `/api/accounts/${accountId}/emails?folder=${encodeURIComponent(folder)}&limit=${limit}&offset=${offset}`,
            )

            if (!response.ok) {
                const error = new Error("Failed to load emails")
                console.error("Failed to load emails", error)
                setLoading(false)
                return
            }

            const data = await response.json()
            setEmails(data.emails)
            setTotal(data.total)
            setLoading(false)
        }

        loadEmails().catch((err) => {
            console.error("Failed to load emails", err)
            setLoading(false)
        })
    }, [accountId, folder, offset])

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-20 bg-muted rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (emails.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No emails in this folder</p>
            </div>
        )
    }

    const hasNext = offset + limit < total
    const hasPrev = offset > 0

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm text-muted-foreground">
          {offset + 1}-{Math.min(offset + limit, total)} of {total}
        </span>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setOffset(offset - limit)} disabled={!hasPrev}>
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setOffset(offset + limit)} disabled={!hasNext}>
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {emails.map((email) => {
                    const from = email.from?.[0]
                    const fromName = from?.name || from?.address || "Unknown"

                    return (
                        <button
                            key={email.uid}
                            className={cn(
                                "w-full text-left p-4 border-b hover:bg-muted/50 transition-colors",
                                selectedUid === email.uid && "bg-muted",
                            )}
                            onClick={() => onEmailSelect(email.uid)}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="font-medium text-sm truncate">{fromName}</span>
                                {email.date && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(email.date), {addSuffix: true})}
                  </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm truncate flex-1">{email.subject || "(No subject)"}</span>
                                {email.hasAttachments &&
                                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0"/>}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
