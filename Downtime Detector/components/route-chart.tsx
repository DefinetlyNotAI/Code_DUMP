"use client"

import {useMemo} from "react"
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts"
import type {StatusLog} from "@/types/types"

interface RouteChartProps {
    logs: StatusLog[]
}

function getColorForStatus(status: number | undefined) {
    if (typeof status !== "number") return "#9CA3AF" // gray
    if (status >= 200 && status < 300) return "#22c55e" // green-500
    if (status >= 300 && status < 400) return "#f59e0b" // amber-500 (yellow)
    // 4xx, 5xx, 0, and others -> red
    return "#ef4444" // red-500
}

const CustomDot = (props: any) => {
    const {cx, cy, payload} = props
    if (cx == null || cy == null) return null
    const color = getColorForStatus(payload?.status)
    return <circle cx={cx} cy={cy} r={3} fill={color} stroke="transparent"/>
}

const CustomActiveDot = (props: any) => {
    const {cx, cy, payload} = props
    if (cx == null || cy == null) return null
    const color = getColorForStatus(payload?.status)
    return <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={1}/>
}

export function RouteChart({logs}: RouteChartProps) {
    const chartData = useMemo(() => {
        // logs are returned newest-first from the DB; reverse to chronological (oldest first)
        const chronological = [...logs].reverse()
        return chronological.map((log) => ({
            time: new Date(log.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
            responseTime: log.responseTime ?? 0,
            status: log.statusCode,
            fullTime: new Date(log.timestamp).toLocaleString(),
        }))
    }, [logs])

    return (
        <div className="h-50 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3}/>
                    <XAxis
                        dataKey="time"
                        tick={{fontSize: 12, fill: "#ffffff"}}
                        tickLine={false}
                        axisLine={{stroke: "hsl(var(--border))"}}
                    />
                    <YAxis
                        tick={{fontSize: 12, fill: "#ffffff"}}
                        tickLine={false}
                        axisLine={{stroke: "hsl(var(--border))"}}
                        label={{
                            value: "ms",
                            angle: -90,
                            position: "insideLeft",
                            fontSize: 12,
                            fill: "#ffffff",
                        }}
                    />
                    <Tooltip
                        content={({active, payload}) => {
                            if (!active || !payload?.length) return null
                            const data = payload[0].payload
                            const status = data.status
                            const isGreen = typeof status === "number" && status >= 200 && status < 300
                            const isYellow = typeof status === "number" && status >= 300 && status < 400

                            const badgeClasses = isGreen
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : isYellow
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                    : "bg-red-500/10 text-red-700 dark:text-red-400"

                            return (
                                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                                    <div className="text-xs text-muted-foreground mb-1">{data.fullTime}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-semibold text-foreground">{data.responseTime}ms
                                        </div>
                                        <div className={`text-xs px-2 py-0.5 rounded ${badgeClasses}`}>
                                            {data.status}
                                        </div>
                                    </div>
                                </div>
                            )
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="responseTime"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={<CustomDot/>}
                        activeDot={<CustomActiveDot/>}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
