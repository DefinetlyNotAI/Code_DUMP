import {Badge} from "@/components/ui/badge"
import {Circle} from "lucide-react"

interface StatusBadgeProps {
    status: "working" | "degraded" | "broken" | "unknown" | "previous-degradations"
    showDot?: boolean
}

export function StatusBadge({status, showDot = true}: StatusBadgeProps) {
    const config = {
        working: {
            label: "Working",
            variant: "default" as const,
            className: "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/20",
            dotClassName: "fill-green-500",
        },
        degraded: {
            label: "Degraded",
            variant: "secondary" as const,
            className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20",
            dotClassName: "fill-yellow-500",
        },
        "previous-degradations": {
            label: "Previous Degradations",
            variant: "secondary" as const,
            className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 border-orange-500/20",
            dotClassName: "fill-orange-500",
        },
        broken: {
            label: "Broken",
            variant: "destructive" as const,
            className: "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 border-red-500/20",
            dotClassName: "fill-red-500",
        },
        unknown: {
            label: "Unknown",
            variant: "outline" as const,
            className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
            dotClassName: "fill-gray-500",
        },
    }

    const {label, className, dotClassName} = config[status]

    return (
        <Badge variant="secondary" className={className}>
            {showDot && <Circle className={`mr-1.5 h-2 w-2 ${dotClassName}`}/>}
            {label}
        </Badge>
    )
}
