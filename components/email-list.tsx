"use client"
/**
 * Email list component
 * Displays paginated list of emails with client-side optimization
 */
import {useCallback, useEffect, useMemo, useState} from "react"
import {Button} from "@/components/ui/button"
import {formatDistanceToNow} from "date-fns"
import {cn} from "@/lib/ui"
import {ChevronLeft, ChevronRight, Paperclip} from "lucide-react"
import {EmailDetail, EmailListProps} from "@/types"
import {Cache} from "@/lib/cache"
import {formatEmailAddressShort, preloadEmails} from "@/lib/client-utils"

export function EmailList({accountId, folder, selectedUid, onEmailSelect}: EmailListProps) {
    const [emails, setEmails] = useState<EmailDetail[]>([])
    const [total, setTotal] = useState(0)
    const [offset, setOffset] = useState(0)
    const [loading, setLoading] = useState(true)
    const limit = 50

    // Preload adjacent emails for faster navigation (client-side optimization)
    useEffect(() => {
        if (emails.length > 0 && selectedUid) {
            const currentIndex = emails.findIndex(e => e.uid === selectedUid)
            if (currentIndex !== -1) {
                const preloadUids: number[] = []

                // Preload next 2 emails
                if (currentIndex < emails.length - 1) {
                    preloadUids.push(emails[currentIndex + 1].uid)
                }
                if (currentIndex < emails.length - 2) {
                    preloadUids.push(emails[currentIndex + 2].uid)
                }

                // Preload previous email
                if (currentIndex > 0) {
                    preloadUids.push(emails[currentIndex - 1].uid)
                }

                if (preloadUids.length > 0) {
                    preloadEmails(accountId, folder, preloadUids)
                }
            }
        }
    }, [selectedUid, emails, accountId, folder])

    // Memoize pagination values (client-side optimization)
    const paginationInfo = useMemo(() => ({
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
        start: offset + 1,
        end: Math.min(offset + limit, total)
    }), [offset, limit, total])

    // Optimized page change handlers
    const handleNextPage = useCallback(() => {
        if (paginationInfo.hasNext) {
            setOffset(offset + limit)
        }
    }, [offset, limit, paginationInfo.hasNext])

    const handlePrevPage = useCallback(() => {
        if (paginationInfo.hasPrev) {
            setOffset(offset - limit)
        }
    }, [offset, limit, paginationInfo.hasPrev])
    useEffect(() => {
        let isInitialLoad = true

        async function loadEmails(showLoading = true) {
            // Only show loading spinner on initial load
            if (showLoading && isInitialLoad) {
                setLoading(true)
            }
            // Try to get from cache first
            const cacheKey = `emails:${accountId}:${folder}:${offset}:${limit}`
            const cached = Cache.get<{ emails: EmailDetail[], total: number }>(cacheKey)
            if (cached && isInitialLoad) {
                console.log(`[EmailList] Using cached emails`)
                setEmails(cached.emails)
                setTotal(cached.total)
                setLoading(false)
                isInitialLoad = false
                return
            }
            try {
                const response = await fetch(
                    `/api/accounts/${accountId}/emails?folder=${encodeURIComponent(folder)}&limit=${limit}&offset=${offset}`,
                )
                if (!response.ok) {
                    console.error("Failed to load emails")
                    // Only set loading false on initial load
                    if (isInitialLoad) {
                        setLoading(false)
                    }
                    return
                }
                const data = await response.json()
                // Cache for 3 minutes (increased from 2 for better performance)
                Cache.set(cacheKey, data, 3 * 60 * 1000)
                setEmails(data.emails)
                setTotal(data.total)
                if (isInitialLoad) {
                    setLoading(false)
                    isInitialLoad = false
                }
            } catch (err) {
                console.error("Failed to load emails", err)
                if (isInitialLoad) {
                    setLoading(false)
                }
            }
        }

        // Initial load
        loadEmails().catch((err) => {
            console.error("Failed to load emails", err)
            setLoading(false)
        })
        // Background refresh every 120 seconds (reduced frequency for better performance)
        const refreshInterval = setInterval(() => {
            console.log('[EmailList] Background refresh...')
            loadEmails(false).catch(console.error)
        }, 120000) // 120 seconds
        return () => clearInterval(refreshInterval)
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

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm text-muted-foreground">
          {paginationInfo.start}-{paginationInfo.end} of {total}
        </span>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handlePrevPage} disabled={!paginationInfo.hasPrev}>
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNextPage} disabled={!paginationInfo.hasNext}>
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {emails.map((email) => {
                    // Client-side formatting for better performance
                    const fromDisplay = formatEmailAddressShort(email.from)
                    const dateDisplay = email.date
                        ? formatDistanceToNow(new Date(email.date), {addSuffix: true})
                        : ""

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
                                <span className="font-medium text-sm truncate">{fromDisplay}</span>
                                {dateDisplay && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {dateDisplay}
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
