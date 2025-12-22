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
import {RateLimitSettings} from "@/lib/settings"

// Force Node.js runtime (required for cookies())
export const runtime = 'nodejs'

// Disable static optimization for this route
export const dynamic = 'force-dynamic'

// Ensure this is treated as an API route
export const revalidate = 0

export async function GET(request: NextRequest) {
    try {
        console.log("[API] /api/accounts - Request received")

        // Check authentication
        const isAuthenticated = await requireAuth()
        if (!isAuthenticated) {
            console.log("[API] /api/accounts - Authentication failed")
            return NextResponse.json(
                {error: "Unauthorized"},
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }

        console.log("[API] /api/accounts - Authentication passed")

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`accounts:${ip}`, RateLimitSettings.accountsLimit, RateLimitSettings.windowMs)

        if (!rateLimit.allowed) {
            console.log("[API] /api/accounts - Rate limit exceeded for IP:", ip)
            return NextResponse.json(
                {error: "Too many requests"},
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }

        console.log("[API] /api/accounts - Getting account list...")

        // Get account list (without credentials)
        const accounts = getAccountList()

        console.log("[API] /api/accounts - Found", accounts.length, "account(s):", accounts)

        return NextResponse.json(
            {accounts},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    } catch (error) {
        console.error("[API] /api/accounts - Failed to list accounts", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        })
        return NextResponse.json(
            {error: "Failed to load accounts"},
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    }
}
