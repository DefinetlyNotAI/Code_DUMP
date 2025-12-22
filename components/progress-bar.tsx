import {cn} from "@/lib/ui"

interface ProgressBarProps {
    value: number
    status: "working" | "degraded" | "broken" | "unknown"
    className?: string
}

export function ProgressBar({value, status, className}: ProgressBarProps) {
    const statusColors = {
        working: "bg-green-500",
        degraded: "bg-yellow-500",
        broken: "bg-red-500",
        unknown: "bg-gray-400",
    }

    return (
        <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
            <div className={cn("h-full transition-all duration-500", statusColors[status])}
                 style={{width: `${value}%`}}/>
        </div>
    )
}
