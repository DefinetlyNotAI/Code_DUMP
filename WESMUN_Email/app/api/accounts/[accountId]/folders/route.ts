/**
 * List folders for a specific account
 *
 * Security:
 * - Requires authentication
 * - Validates account exists
 * - Rate limited
 */

import {type NextRequest, NextResponse} from "next/server"
import {requireAuth} from "@/lib/auth"
import {listFolders} from "@/lib/imap-service"
import {checkRateLimit} from "@/lib/rate-limit"
import {CacheSettings, RateLimitSettings} from "@/lib/settings"

export async function GET(request: NextRequest, {params}: { params: Promise<{ accountId: string }> }) {
    try {
        console.log("[API] /api/accounts/[accountId]/folders - Request received")

        // Check authentication
        const isAuthenticated = await requireAuth()
        if (!isAuthenticated) {
            console.log("[API] /api/accounts/[accountId]/folders - Authentication failed")
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const {accountId} = await params
        console.log("[API] /api/accounts/[accountId]/folders - Account ID:", accountId)

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`folders:${ip}`, RateLimitSettings.foldersLimit, RateLimitSettings.windowMs)

        if (!rateLimit.allowed) {
            console.log("[API] /api/accounts/[accountId]/folders - Rate limit exceeded")
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

        console.log("[API] /api/accounts/[accountId]/folders - Listing folders for account:", accountId)

        // Get folders
        const folders = await listFolders(accountId)

        console.log("[API] /api/accounts/[accountId]/folders - Found", folders.length, "folder(s)")

        return NextResponse.json(
            {folders},
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Cache using centralized settings
                    'Cache-Control': `public, max-age=${CacheSettings.server.foldersMaxAge}, stale-while-revalidate=${CacheSettings.server.foldersSWR}`,
                },
            },
        )
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error("[API] /api/accounts/[accountId]/folders - Failed to list folders", {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
        })
        return NextResponse.json(
            {error: errorMessage},
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    }
}
