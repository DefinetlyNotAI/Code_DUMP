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

export async function GET(request: NextRequest, {params}: { params: Promise<{ accountId: string; uid: string }> }) {
    try {
        // Check authentication
        const isAuthenticated = await requireAuth()
        if (!isAuthenticated) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const {accountId, uid} = await params

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`email:${ip}`, 30, 60 * 1000) // 30 per minute

        if (!rateLimit.allowed) {
            return NextResponse.json({error: "Too many requests"}, {status: 429})
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams
        const folder = searchParams.get("folder")

        if (!folder) {
            return NextResponse.json({error: "Folder parameter required"}, {status: 400})
        }

        const uidNum = Number.parseInt(uid, 10)
        if (isNaN(uidNum)) {
            return NextResponse.json({error: "Invalid UID"}, {status: 400})
        }

        // Get email
        const email = await getEmail(accountId, folder, uidNum)

        if (!email) {
            return NextResponse.json({error: "Email not found"}, {status: 404})
        }

        return NextResponse.json({email})
    } catch (error) {
        console.error("[API] Failed to get email", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return NextResponse.json({error: "Failed to load email"}, {status: 500})
    }
}
