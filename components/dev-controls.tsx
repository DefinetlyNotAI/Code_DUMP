"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Trash, RefreshCw} from "lucide-react"
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
    const {toast} = useToast()

    const handleDeleteAll = async () => {
        if (!confirm(`Delete all logs for project ${projectSlug}? This cannot be undone.`)) return
        setLoadingDelete(true)
        try {
            const res = await fetch(`/api/status/clear?project=${encodeURIComponent(projectSlug)}`, {method: "POST"})
            const data = await res.json()
            if (res.ok) {
                toast({title: "Cleared logs", description: data.message || "Logs cleared"})
                // refresh to show empty logs
                setTimeout(() => window.location.reload(), 800)
            } else {
                toast({title: "Failed to clear logs", description: data.error || JSON.stringify(data), variant: "destructive"})
            }
        } catch (err) {
            toast({title: "Error", description: "Failed to clear logs", variant: "destructive"})
        } finally {
            setLoadingDelete(false)
        }
    }

    const handleCheckAll = async () => {
        if (!confirm(`Trigger checks for all static routes of ${projectSlug}?`)) return
        setLoadingCheckAll(true)
        try {
            const res = await fetch(`/api/updateStatus/${encodeURIComponent(projectSlug)}`, {method: "POST"})
            const data = await res.json()
            if (res.ok) {
                toast({title: "Check All started", description: data.message || "Triggered checks"})
                // reload after a short delay to let server finish
                setTimeout(() => window.location.reload(), 1500)
            } else {
                toast({title: "Failed to trigger checks", description: data.error || JSON.stringify(data), variant: "destructive"})
            }
        } catch (err) {
            toast({title: "Error", description: "Failed to trigger checks", variant: "destructive"})
        } finally {
            setLoadingCheckAll(false)
        }
    }

    return (
        <div className="flex items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={handleCheckAll} disabled={loadingCheckAll} className="bg-transparent">
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingCheckAll ? "animate-spin" : ""}`}/>
                {loadingCheckAll ? "Checking..." : "Check All"}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={loadingDelete} className="bg-transparent">
                <Trash className={`mr-2 h-4 w-4`}/>
                {loadingDelete ? "Deleting..." : "Delete all"}
            </Button>
        </div>
    )
}

