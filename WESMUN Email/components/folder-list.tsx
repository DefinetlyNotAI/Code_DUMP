"use client"

/**
 * Folder list component
 * Displays mailbox folders
 */

import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Archive, Folder, Inbox, Send, Trash2} from "lucide-react"
import {cn} from "@/lib/ui"
import {EmailFolder, FolderListProps} from "@/types";
import {Cache} from "@/lib/cache"
import {CacheSettings, FolderSettings, RefreshSettings} from "@/lib/settings"

export function FolderList({accountId, selectedFolder, onFolderSelect, onLoadingComplete}: FolderListProps) {
    const [folders, setFolders] = useState<EmailFolder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isInitialLoad = true

        async function loadFolders(showLoading = true) {
            // Only show loading spinner on initial load
            if (showLoading && isInitialLoad) {
                setLoading(true)
            }

            console.log(`[FolderList] Loading folders for account: ${accountId}`)

            // Try to get from cache first
            const cacheKey = `folders:${accountId}`
            const cached = Cache.get<EmailFolder[]>(cacheKey)

            if (cached && isInitialLoad) {
                console.log(`[FolderList] Using cached folders`)
                const sortedFolders = sortFolders(cached)
                setFolders(sortedFolders)
                setLoading(false)

                // Auto-select Inbox (only once) if enabled in settings
                if (FolderSettings.autoSelectInbox && !selectedFolder) {
                    const inbox = sortedFolders.find((f: EmailFolder) =>
                        f.name.toUpperCase() === "INBOX" || f.specialUse === "\\Inbox"
                    )
                    if (inbox) {
                        console.log(`[FolderList] Auto-selecting inbox: ${inbox.path}`)
                        onFolderSelect(inbox.path)
                    }
                }

                isInitialLoad = false

                // Notify parent that loading is complete
                if (onLoadingComplete) {
                    onLoadingComplete()
                }

                // Fetch fresh counts in background without blocking UI
                return
            }

            // Fetch fresh data
            const response = await fetch(`/api/accounts/${accountId}/folders`)
            console.log(`[FolderList] Response status: ${response.status}`)

            if (!response.ok) {
                const errorData = await response.json()
                console.error(`[FolderList] Error response:`, errorData)
                const errorMessage = errorData.error || "Failed to load folders"
                console.error("[FolderList] Failed to load folders:", errorMessage)

                // Only set error on initial load
                if (isInitialLoad) {
                    setError(errorMessage)
                    setLoading(false)
                }
                return
            }

            const data = await response.json()
            console.log(`[FolderList] Loaded ${data.folders?.length || 0} folders`)

            // Cache using centralized settings
            Cache.set(cacheKey, data.folders, CacheSettings.client.folders)

            // Sort folders: Inbox -> Archive -> Spam -> Drafts -> Sent -> Trash -> Others
            const sortedFolders = sortFolders(data.folders)
            setFolders(sortedFolders)

            // Auto-select Inbox only on initial load
            if (isInitialLoad) {
                const inbox = sortedFolders.find((f: EmailFolder) =>
                    f.name.toUpperCase() === "INBOX" || f.specialUse === "\\Inbox"
                )
                if (inbox) {
                    console.log(`[FolderList] Auto-selecting inbox: ${inbox.path}`)
                    onFolderSelect(inbox.path)
                }
            }

            if (isInitialLoad) {
                setLoading(false)
                isInitialLoad = false

                // Notify parent that loading is complete
                if (onLoadingComplete) {
                    onLoadingComplete()
                }
            }
        }

        // Initial load
        loadFolders().catch((err) => {
            const errorMessage = err instanceof Error ? err.message : "Failed to load folders"
            console.error("[FolderList] Failed to load folders:", errorMessage)
            setError(errorMessage)
            setLoading(false)
        })

        // Background refresh using centralized settings
        const refreshInterval = setInterval(() => {
            console.log('[FolderList] Background refresh...')
            loadFolders(false).catch(console.error)
        }, RefreshSettings.folderList)

        return () => clearInterval(refreshInterval)
    }, [accountId])

    function sortFolders(folders: EmailFolder[]): EmailFolder[] {
        return [...folders].sort((a, b) => {
            // Check if folder is Inbox
            const aIsInbox = a.name.toUpperCase() === "INBOX" || a.specialUse === "\\Inbox"
            const bIsInbox = b.name.toUpperCase() === "INBOX" || b.specialUse === "\\Inbox"

            // Inbox always comes first
            if (aIsInbox && !bIsInbox) return -1
            if (!aIsInbox && bIsInbox) return 1

            // After Inbox, order by special use
            const order = ['\\Archive', '\\Junk', '\\Drafts', '\\Sent', '\\Trash']
            const aIndex = order.indexOf(a.specialUse || '')
            const bIndex = order.indexOf(b.specialUse || '')

            // If both have special use, sort by order
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex
            }

            // Special use folders come before regular folders
            if (aIndex !== -1) return -1
            if (bIndex !== -1) return 1

            // Otherwise sort alphabetically
            return a.name.localeCompare(b.name)
        })
    }

    function getFolderIcon(folder: EmailFolder) {
        if (folder.name.toUpperCase() === "INBOX" || folder.specialUse === "\\Inbox") return Inbox
        if (folder.specialUse === "\\Sent") return Send
        if (folder.specialUse === "\\Trash") return Trash2
        if (folder.specialUse === "\\Archive") return Archive
        return Folder
    }

    function getFolderDisplayName(folder: EmailFolder): string {
        // Rename INBOX to Inbox
        if (folder.name.toUpperCase() === "INBOX") {
            return "Inbox"
        }
        return folder.name
    }

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-9 bg-muted rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    return (
        <div className="p-2">
            <h2 className="px-2 py-1 text-sm font-semibold text-muted-foreground mb-2">Folders</h2>
            <div className="space-y-1">
                {folders.map((folder) => {
                    const Icon = getFolderIcon(folder)
                    const hasUnread = folder.unreadCount && folder.unreadCount > 0

                    return (
                        <Button
                            key={folder.path}
                            variant="ghost"
                            size="sm"
                            className={cn("w-full justify-start", selectedFolder === folder.path && "bg-muted hover:bg-muted")}
                            onClick={() => onFolderSelect(folder.path)}
                        >
                            <Icon className="h-4 w-4 mr-2"/>
                            <span className="truncate flex-1 text-left">{getFolderDisplayName(folder)}</span>
                            {hasUnread && (
                                <Badge
                                    variant="default"
                                    className="ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold"
                                >
                                    {folder.unreadCount! > 99 ? '99+' : folder.unreadCount}
                                </Badge>
                            )}
                        </Button>
                    )
                })}
            </div>
        </div>
    )
}
