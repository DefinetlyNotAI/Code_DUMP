"use client"

/**
 * Main dashboard client component
 * Manages state for account selection, folder browsing, and email viewing
 */

import {useEffect, useState} from "react"
import {FolderList} from "./folder-list"
import {EmailList} from "./email-list"
import {EmailViewer} from "./email-viewer"
import {DashboardHeader} from "./dashboard-header"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle} from "lucide-react"
import {Account} from "@/types";
import {Cache} from "@/lib/cache"
import {UISettings} from "@/lib/settings"

export function DashboardClient() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
    const [selectedEmail, setSelectedEmail] = useState<{ uid: number; folder: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [switchingAccount, setSwitchingAccount] = useState(false)
    const [foldersLoaded, setFoldersLoaded] = useState(false)

    // Handle account change with loading state
    const handleAccountChange = (accountId: string) => {
        if (switchingAccount) {
            console.log('[Dashboard] Account switch in progress, ignoring...')
            return
        }

        console.log('[Dashboard] Switching to account:', accountId)

        // Clear cache for the previous account's folders and emails
        if (selectedAccount) {
            // Remove folders cache for previous account
            Cache.remove(`folders:${selectedAccount}`)

            // Remove all email-related cache for previous account
            Cache.removeByPrefix(`emails:${selectedAccount}:`)
        }

        setSwitchingAccount(true)
        setFoldersLoaded(false)
        setSelectedAccount(accountId)
        setSelectedFolder(null)
        setSelectedEmail(null)
    }

    // Reset switching state when folders are loaded
    useEffect(() => {
        if (foldersLoaded && switchingAccount) {
            console.log('[Dashboard] Folders loaded, account switch complete')
            setSwitchingAccount(false)
        }
    }, [foldersLoaded, switchingAccount])

    // Load accounts on mount
    useEffect(() => {
        async function loadAccounts() {
            // Try to get from cache first
            const cacheKey = 'accounts'
            const cached = Cache.get<Account[]>(cacheKey)

            if (cached) {
                console.log('[Dashboard] Using cached accounts')
                setAccounts(cached)
                setLoading(false)

                // Auto-select first account
                if (cached.length > 0) {
                    setSelectedAccount(cached[0].id)
                }

                // Fetch fresh data in background
                fetch("/api/accounts").then(async (response) => {
                    if (response.ok) {
                        const data = await response.json()
                        Cache.set(cacheKey, data.accounts, 30 * 60 * 1000)
                        setAccounts(data.accounts)
                    }
                }).catch(console.error)

                return
            }

            const response = await fetch("/api/accounts")

            if (!response.ok) {
                const error = new Error("Failed to load accounts")
                setError(error.message)
                setLoading(false)
                console.error(error)
                return
            }

            const data = await response.json()

            // Cache accounts for 30 minutes
            Cache.set(cacheKey, data.accounts, 30 * 60 * 1000)

            setAccounts(data.accounts)

            // Auto-select first account
            if (data.accounts.length > 0) {
                setSelectedAccount(data.accounts[0].id)
            }

            setLoading(false)
        }

        loadAccounts().catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load accounts")
            setLoading(false)
            console.error(err)
        })
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader
                accounts={accounts}
                selectedAccount={selectedAccount}
                onAccountChange={handleAccountChange}
                disabled={switchingAccount}
            />

            <div className="flex h-[calc(100vh-4rem)]">
                {/* Folder sidebar */}
                <div className="border-r bg-muted/30 overflow-y-auto" style={{width: `${UISettings.sidebarWidth}px`}}>
                    {selectedAccount && (
                        <FolderList
                            accountId={selectedAccount}
                            selectedFolder={selectedFolder}
                            onFolderSelect={(folder) => {
                                // Clear cache for the previous folder's emails when switching
                                if (selectedFolder && selectedAccount) {
                                    Cache.removeByPrefix(`emails:${selectedAccount}:${selectedFolder}:`)
                                }
                                setSelectedFolder(folder)
                                setSelectedEmail(null)
                            }}
                            onLoadingComplete={() => setFoldersLoaded(true)}
                        />
                    )}
                </div>

                {/* Email list */}
                <div className="border-r bg-background overflow-y-auto"
                     style={{width: `${UISettings.emailListWidth}px`}}>
                    {selectedAccount && selectedFolder && (
                        <EmailList
                            accountId={selectedAccount}
                            folder={selectedFolder}
                            selectedUid={selectedEmail?.uid}
                            onEmailSelect={(uid) => setSelectedEmail({uid, folder: selectedFolder})}
                        />
                    )}
                </div>

                {/* Email viewer */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {selectedEmail ? (
                        <EmailViewer accountId={selectedAccount!} folder={selectedEmail.folder}
                                     uid={selectedEmail.uid}/>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p>Select an email to view</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
