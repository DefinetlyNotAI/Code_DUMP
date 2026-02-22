"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {RefreshCw} from "lucide-react"
import {useToast} from "@/hooks/use-toast"

interface ManualCheckButtonProps {
    projectSlug: string
    routePath: string
    onClick?: (e: React.MouseEvent) => void
}

export function ManualCheckButton({projectSlug, routePath, onClick}: ManualCheckButtonProps) {
    // Remove manual check buttons in production builds
    if (process.env.NODE_ENV === "production") return null

    const [loading, setLoading] = useState(false)
    const {toast} = useToast()

    const handleCheck = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        onClick?.(e)

        setLoading(true)

        try {
            const response = await fetch(`/api/report?project=${projectSlug}&route=${encodeURIComponent(routePath)}`, {
                method: "POST",
            })

            const data = await response.json()

            // If server returned a helpful message (e.g., auth/method guidance), show it
            if (data.message && data.help) {
                toast({
                    title: data.message,
                    description: data.help,
                    variant: "destructive",
                })
            } else if (data.result?.success) {
                toast({
                    title: "Check Completed",
                    description: `Response time: ${data.result.responseTime}ms (Status: ${data.result.statusCode})`,
                })
            } else {
                // Non-2xx site status (404/500/405 etc.)
                if (data.result?.redirected) {
                    toast({
                        title: "Check Redirected",
                        description: `The endpoint redirected (HTTP ${data.result.statusCode}).`,
                    })
                } else if (data.result && typeof data.result.statusCode === "number") {
                    // site returned an explicit HTTP code that is not 2xx
                    toast({
                        title: `Endpoint returned ${data.result.statusCode}`,
                        description: data.result.error || `Status ${data.result.statusCode}`,
                    })
                } else {
                    // application-level failure
                    toast({
                        title: "Check Failed",
                        description: data.result?.error || "Unable to reach the endpoint",
                        variant: "destructive",
                    })
                }
            }

            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to perform manual check",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleCheck} disabled={loading}
                className="shrink-0 bg-transparent">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}/>
            {loading ? "Checking..." : "Check Now"}
        </Button>
    )
}
