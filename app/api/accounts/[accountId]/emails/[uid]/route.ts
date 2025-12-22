/**
 * Get full email details
 *
 * Security:
 * - Requires authentication
 * - HTML sanitized server-side
 * - Rate limited
 */

import {type NextRequest, NextResponse} from "next/server"
import {requireAuth} from "@/lib/auth"
import {getEmail} from "@/lib/imap-service"
import {checkRateLimit} from "@/lib/rate-limit"
import {CacheSettings, RateLimitSettings} from "@/lib/settings"

// Force Node.js runtime (required for cookies())
export const runtime = 'nodejs'

// Disable static optimization for this route
export const dynamic = 'force-dynamic'

// Ensure this is treated as an API route
export const revalidate = 0

export async function GET(request: NextRequest, {params}: { params: Promise<{ accountId: string; uid: string }> }) {
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

        const {accountId, uid} = await params

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`email:${ip}`, RateLimitSettings.emailLimit, RateLimitSettings.windowMs)

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

        const uidNum = Number.parseInt(uid, 10)
        if (isNaN(uidNum)) {
            return NextResponse.json(
                {error: "Invalid UID"},
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }

        // Get email
        const email = await getEmail({
            accountId,
            folderPath: folder,
            uid: uidNum
        })

        if (!email) {
            return NextResponse.json(
                {error: "Email not found"},
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }

        return NextResponse.json(
            {email},
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Cache using centralized settings
                    'Cache-Control': `public, max-age=${CacheSettings.server.emailMaxAge}, stale-while-revalidate=${CacheSettings.server.emailSWR}`,
                },
            },
        )
    } catch (error) {
        console.error("[API] Failed to get email", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return NextResponse.json(
            {error: "Failed to load email"},
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    }
}
