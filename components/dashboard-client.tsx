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

interface Account {
    id: string
    label: string
}

export function DashboardClient() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
    const [selectedEmail, setSelectedEmail] = useState<{ uid: number; folder: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Load accounts on mount
    useEffect(() => {
        async function loadAccounts() {
            try {
                const response = await fetch("/api/accounts")
                if (!response.ok) throw new Error("Failed to load accounts")

                const data = await response.json()
                setAccounts(data.accounts)

                // Auto-select first account
                if (data.accounts.length > 0) {
                    setSelectedAccount(data.accounts[0].id)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load accounts")
            } finally {
                setLoading(false)
            }
        }

        loadAccounts().catch(console.error)
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
            <DashboardHeader accounts={accounts} selectedAccount={selectedAccount}
                             onAccountChange={setSelectedAccount}/>

            <div className="flex h-[calc(100vh-4rem)]">
                {/* Folder sidebar */}
                <div className="w-64 border-r bg-muted/30 overflow-y-auto">
                    {selectedAccount && (
                        <FolderList
                            accountId={selectedAccount}
                            selectedFolder={selectedFolder}
                            onFolderSelect={(folder) => {
                                setSelectedFolder(folder)
                                setSelectedEmail(null)
                            }}
                        />
                    )}
                </div>

                {/* Email list */}
                <div className="w-96 border-r bg-background overflow-y-auto">
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
