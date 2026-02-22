"use client"

import {useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {StatusBadge} from "@/components/status-badge"
import {ProgressBar} from "@/components/progress-bar"
import {RouteChart} from "@/components/route-chart"
import {ManualCheckButton} from "@/components/manual-check-button"
import {ChevronDown, ChevronRight} from "lucide-react"
import type {RouteStatus} from "@/types/types"

interface CollapsibleRouteProps {
    route: RouteStatus
    projectSlug: string
}

export function CollapsibleRoute({route, projectSlug}: CollapsibleRouteProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <Card className="overflow-hidden border-border hover:border-primary/50 transition-colors">
            <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5"/>
                        ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5"/>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <CardTitle className="text-xl">{route.title}</CardTitle>
                                <StatusBadge status={route.currentStatus}/>
                                <span className="text-lg font-bold text-foreground">{route.uptime}%</span>
                            </div>
                            <CardDescription className="mb-2">{route.description}</CardDescription>
                            <code
                                className="text-xs bg-muted px-2 py-1 rounded text-foreground/80 font-mono">{route.path}</code>
                        </div>
                    </div>
                    <ManualCheckButton projectSlug={projectSlug} routePath={route.path}
                                       onClick={(e) => e.stopPropagation()}/>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-6 border-t border-border pt-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Uptime</span>
                        </div>
                        <ProgressBar value={route.uptime} status={route.currentStatus}/>
                        <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Last checked: {route.lastChecked ? new Date(route.lastChecked).toLocaleString() : "Never"}
              </span>
                            <span
                                className="text-xs text-muted-foreground">{route.statusLogs.length} checks in last 24h</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-foreground mb-4">Response Time (24 hours)</h3>
                        <RouteChart logs={route.statusLogs}/>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
