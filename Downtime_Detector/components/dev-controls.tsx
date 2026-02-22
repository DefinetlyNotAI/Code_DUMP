"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {RefreshCw, Trash} from "lucide-react"
import {useToast} from "@/hooks/use-toast"

interface DevControlsProps {
    projectSlug: string
    routes: string[]
}

export default function DevControls({projectSlug}: DevControlsProps) {
    // Only show in non-production
    if (process.env.NODE_ENV === "production") return null

    const [loadingDelete, setLoadingDelete] = useState(false)
    const [loadingCheckAll, setLoadingCheckAll] = useState(false)
    const [confirmAction, setConfirmAction] = useState<null | "delete" | "checkAll">(null)
    const {toast} = useToast()

    const doDeleteAll = async () => {
        setConfirmAction(null)
        setLoadingDelete(true)
        try {
            const res = await fetch(`/api/status/clear?project=${encodeURIComponent(projectSlug)}`, {method: "POST"})
            const data = await res.json()
            if (res.ok) {
                toast({title: "Cleared logs", description: data.message || "Logs cleared"})
                setTimeout(() => window.location.reload(), 800)
            } else {
                toast({
                    title: "Failed to clear logs",
                    description: data.error || JSON.stringify(data),
                    variant: "destructive"
                })
            }
        } catch (err) {
            toast({title: "Error", description: "Failed to clear logs", variant: "destructive"})
        } finally {
            setLoadingDelete(false)
        }
    }

    const doCheckAll = async () => {
        setConfirmAction(null)
        setLoadingCheckAll(true)
        try {
            const res = await fetch(`/api/updateStatus/${encodeURIComponent(projectSlug)}`, {method: "POST"})
            const data = await res.json()
            if (res.ok) {
                toast({title: "Check All started", description: data.message || "Triggered checks"})
                setTimeout(() => window.location.reload(), 1500)
            } else {
                toast({
                    title: "Failed to trigger checks",
                    description: data.error || JSON.stringify(data),
                    variant: "destructive"
                })
            }
        } catch (err) {
            toast({title: "Error", description: "Failed to trigger checks", variant: "destructive"})
        } finally {
            setLoadingCheckAll(false)
        }
    }

    return (
        <div className="flex items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmAction("checkAll")} disabled={loadingCheckAll}
                    className="bg-transparent">
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingCheckAll ? "animate-spin" : ""}`}/>
                {loadingCheckAll ? "Checking..." : "Check All"}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirmAction("delete")} disabled={loadingDelete}
                    className="bg-transparent">
                <Trash className={`mr-2 h-4 w-4`}/>
                {loadingDelete ? "Deleting..." : "Delete all"}
            </Button>

            {/* Confirmation modal (in-app, no native alert) */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmAction(null)}/>
                    <div className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {confirmAction === "delete" ? "Confirm delete all logs" : "Confirm check all routes"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {confirmAction === "delete"
                                ? `This will permanently delete all logs for ${projectSlug}. This action cannot be undone.`
                                : `This will trigger checks for all static routes for ${projectSlug}.`}
                        </p>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant={confirmAction === "delete" ? "destructive" : "default"}
                                size="sm"
                                onClick={confirmAction === "delete" ? doDeleteAll : doCheckAll}
                                disabled={confirmAction === "delete" ? loadingDelete : loadingCheckAll}
                            >
                                {confirmAction === "delete" ? (loadingDelete ? "Deleting..." : "Delete") : (loadingCheckAll ? "Checking..." : "Confirm")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
