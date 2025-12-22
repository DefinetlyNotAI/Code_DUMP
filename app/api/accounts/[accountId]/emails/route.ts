/**
 * List emails in a folder
 *
 * Security:
 * - Requires authentication
 * - Pagination enforced (max 100 per request)
 * - Rate limited
 */

import {type NextRequest, NextResponse} from "next/server"
import {requireAuth} from "@/lib/auth"
import {listEmails} from "@/lib/imap-service"
import {checkRateLimit} from "@/lib/rate-limit"
import {CacheSettings} from "@/lib/settings"

// Force Node.js runtime (required for cookies())
export const runtime = 'nodejs'

// Disable static optimization for this route
export const dynamic = 'force-dynamic'

// Ensure this is treated as an API route
export const revalidate = 0

export async function GET(request: NextRequest, {params}: { params: Promise<{ accountId: string }> }) {
    try {
        // Check authentication
        const isAuthenticated = await requireAuth()
        if (!isAuthenticated) {
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

        const {accountId} = await params

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`emails:${ip}`, 20, 60 * 1000) // 20 per minute

        if (!rateLimit.allowed) {
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

        // Parse query params
        const searchParams = request.nextUrl.searchParams
        const folder = searchParams.get("folder")
        const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10), 100) // Max 100
        const offset = Number.parseInt(searchParams.get("offset") || "0", 10)

        if (!folder) {
            return NextResponse.json(
                {error: "Folder parameter required"},
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }

        // Get emails
        const result = await listEmails({
            accountId,
            folderPath: folder,
            options: {limit, offset}
        })

        return NextResponse.json(
            result,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Cache using centralized settings
                    'Cache-Control': `public, max-age=${CacheSettings.server.emailsMaxAge}, stale-while-revalidate=${CacheSettings.server.emailsSWR}`,
                },
            },
        )
    } catch (error) {
        console.error("[API] Failed to list emails", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return NextResponse.json(
            {error: "Failed to load emails"},
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    }
}
