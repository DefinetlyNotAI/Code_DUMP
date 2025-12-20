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

export async function GET(request: NextRequest, {params}: { params: Promise<{ accountId: string }> }) {
    try {
        // Check authentication
        const isAuthenticated = await requireAuth()
        if (!isAuthenticated) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const {accountId} = await params

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`emails:${ip}`, 20, 60 * 1000) // 20 per minute

        if (!rateLimit.allowed) {
            return NextResponse.json({error: "Too many requests"}, {status: 429})
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams
        const folder = searchParams.get("folder")
        const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10), 100) // Max 100
        const offset = Number.parseInt(searchParams.get("offset") || "0", 10)

        if (!folder) {
            return NextResponse.json({error: "Folder parameter required"}, {status: 400})
        }

        // Get emails
        const result = await listEmails(accountId, folder, {limit, offset})

        return NextResponse.json(result)
    } catch (error) {
        console.error("[API] Failed to list emails", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return NextResponse.json({error: "Failed to load emails"}, {status: 500})
    }
}
