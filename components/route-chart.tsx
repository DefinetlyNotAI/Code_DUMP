"use client"

import {useMemo} from "react"
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts"
import type {StatusLog} from "@/types/types"

interface RouteChartProps {
    logs: StatusLog[]
}

export function RouteChart({logs}: RouteChartProps) {
    const chartData = useMemo(() => {
        return logs.map((log) => ({
            time: new Date(log.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
            responseTime: log.responseTime || 0,
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
                            return (
                                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                                    <div className="text-xs text-muted-foreground mb-1">{data.fullTime}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-semibold text-foreground">{data.responseTime}ms
                                        </div>
                                        <div
                                            className={`text-xs px-2 py-0.5 rounded ${
                                                data.status >= 200 && data.status < 400
                                                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                                            }`}
                                        >
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
                        dot={{fill: "#ffffff", r: 3}}
                        activeDot={{r: 5, fill: "#ffffff"}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
