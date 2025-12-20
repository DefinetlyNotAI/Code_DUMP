"use client"

/**
 * Folder list component
 * Displays mailbox folders
 */

import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Archive, Folder, Inbox, Send, Trash2} from "lucide-react"
import {cn} from "@/lib/utils"

interface EmailFolder {
    name: string
    path: string
    specialUse?: string
}

interface FolderListProps {
    accountId: string
    selectedFolder: string | null
    onFolderSelect: (folder: string) => void
}

export function FolderList({accountId, selectedFolder, onFolderSelect}: FolderListProps) {
    const [folders, setFolders] = useState<EmailFolder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadFolders() {
            try {
                setLoading(true)
                console.log(`[FolderList] Loading folders for account: ${accountId}`)
                const response = await fetch(`/api/accounts/${accountId}/folders`)
                console.log(`[FolderList] Response status: ${response.status}`)

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error(`[FolderList] Error response:`, errorData)
                    throw new Error(errorData.error || "Failed to load folders")
                }

                const data = await response.json()
                console.log(`[FolderList] Loaded ${data.folders?.length || 0} folders`)
                setFolders(data.folders)

                // Auto-select INBOX
                const inbox = data.folders.find((f: EmailFolder) => f.name === "INBOX" || f.specialUse === "\\Inbox")
                if (inbox) {
                    console.log(`[FolderList] Auto-selecting inbox: ${inbox.path}`)
                    onFolderSelect(inbox.path)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load folders"
                console.error("[FolderList] Failed to load folders:", errorMessage)
                setError(errorMessage)
            } finally {
                setLoading(false)
            }
        }

        loadFolders().catch(console.error)
    }, [accountId])

    function getFolderIcon(folder: EmailFolder) {
        if (folder.name === "INBOX" || folder.specialUse === "\\Inbox") return Inbox
        if (folder.specialUse === "\\Sent") return Send
        if (folder.specialUse === "\\Trash") return Trash2
        if (folder.specialUse === "\\Archive") return Archive
        return Folder
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
                    return (
                        <Button
                            key={folder.path}
                            variant="ghost"
                            size="sm"
                            className={cn("w-full justify-start", selectedFolder === folder.path && "bg-muted hover:bg-muted")}
                            onClick={() => onFolderSelect(folder.path)}
                        >
                            <Icon className="h-4 w-4 mr-2"/>
                            <span className="truncate">{folder.name}</span>
                        </Button>
                    )
                })}
            </div>
        </div>
    )
}
