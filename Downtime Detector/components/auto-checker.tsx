"use client"

import {useEffect, useState} from "react"
import {clientConfig} from '@/lib/settings'

interface RouteInfo {
    projectSlug: string
    path: string
    lastChecked: string | null
}

// Use clientConfig values (fallbacks already handled by settings)
const AUTO_CHECK_ENABLED = clientConfig.autoCheck.enabled
const STALE_MINUTES = clientConfig.autoCheck.staleMinutes
const SESSION_KEY_PREFIX = clientConfig.autoCheck.sessionKeyPrefix
const REQUEST_DELAY_MS = clientConfig.autoCheck.requestDelayMs
const MOBILE_REDUCE_FACTOR = clientConfig.autoCheck.mobileReducedFrequencyFactor ?? 2

function getSessionKey(project: string, path: string) {
    return `${SESSION_KEY_PREFIX}${project}::${path}`
}

function wasAttemptedRecently(project: string, path: string) {
    try {
        const key = getSessionKey(project, path)
        const val = sessionStorage.getItem(key)
        if (!val) return false
        const ts = Number(val)
        if (Number.isNaN(ts)) return false
        const diffMin = (Date.now() - ts) / (1000 * 60)
        return diffMin < STALE_MINUTES
    } catch (e) {
        return false
    }
}

function markAttemptedNow(project: string, path: string) {
    try {
        const key = getSessionKey(project, path)
        sessionStorage.setItem(key, String(Date.now()))
    } catch (e) {
        // ignore storage failures
    }
}

function isMobileUserAgent() {
    if (typeof navigator === 'undefined') return false
    return /Mobi|Android|iPhone|iPad|iPod|Silk/i.test(navigator.userAgent)
}

export default function AutoChecker({routes}: { routes: RouteInfo[] }) {
    const [running, setRunning] = useState(false)

    useEffect(() => {
        // Only run in the browser
        if (typeof window === "undefined") return
        if (!AUTO_CHECK_ENABLED) return
        if (!routes || routes.length === 0) return
        if (running) return

        const now = Date.now()
        const staleRoutes = routes.filter((r) => {
            // If server has no lastChecked, treat as stale, but respect client-side attempts
            if (!r.lastChecked) {
                // skip if we attempted recently in this tab/session
                return !wasAttemptedRecently(r.projectSlug, r.path)
            }
            const last = new Date(r.lastChecked).getTime()
            const diffMin = (now - last) / (1000 * 60)
            // also ensure we didn't attempt recently client-side
            return diffMin >= STALE_MINUTES && !wasAttemptedRecently(r.projectSlug, r.path)
        })

        if (staleRoutes.length === 0) return

        setRunning(true)

        ;(async () => {
            let anyLogged = false
            try {
                const mobile = isMobileUserAgent()
                const delayFactor = mobile ? MOBILE_REDUCE_FACTOR : 1

                // Fire checks sequentially to avoid hammering origin
                for (const rt of staleRoutes) {
                    // mark attempt now so reloads in this tab don't re-trigger
                    markAttemptedNow(rt.projectSlug, rt.path)

                    try {
                        const res = await fetch(`/api/report?project=${rt.projectSlug}&route=${encodeURIComponent(rt.path)}`, {
                            method: "POST",
                        })
                        const data = await res.json()

                        // server will return whether it wrote a log (logged: true/false)
                        if (data?.result?.logged === true || data?.logged === true) {
                            anyLogged = true
                        }
                    } catch (e) {
                        // ignore individual failures
                    }

                    // small delay between requests
                    await new Promise((res) => setTimeout(res, REQUEST_DELAY_MS * delayFactor))
                }
            } catch (err) {
                // ignore overall failures
            } finally {
                // Only reload to fetch fresh status data if the server wrote at least one DB row
                if (anyLogged) {
                    window.location.reload()
                }
            }
        })()
    }, [routes, running])

    return null
}
