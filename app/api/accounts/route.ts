/**
 * List all configured email accounts
 *
 * Security:
 * - Requires authentication
 * - Returns only account IDs and labels (no credentials)
 * - Rate limited
 */

import {type NextRequest, NextResponse} from "next/server"
import {requireAuth} from "@/lib/auth"
import {getAccountList} from "@/lib/imap-config"
import {checkRateLimit} from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
    try {
        console.log("[API] /api/accounts - Request received")

        // Check authentication
        const isAuthenticated = await requireAuth()
        if (!isAuthenticated) {
            console.log("[API] /api/accounts - Authentication failed")
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        console.log("[API] /api/accounts - Authentication passed")

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`accounts:${ip}`, 30, 60 * 1000) // 30 per minute

        if (!rateLimit.allowed) {
            console.log("[API] /api/accounts - Rate limit exceeded for IP:", ip)
            return NextResponse.json({error: "Too many requests"}, {status: 429})
        }

        console.log("[API] /api/accounts - Getting account list...")

        // Get account list (without credentials)
        const accounts = getAccountList()

        console.log("[API] /api/accounts - Found", accounts.length, "account(s):", accounts)

        return NextResponse.json({accounts})
    } catch (error) {
        console.error("[API] /api/accounts - Failed to list accounts", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        })
        return NextResponse.json({error: "Failed to load accounts"}, {status: 500})
    }
}
