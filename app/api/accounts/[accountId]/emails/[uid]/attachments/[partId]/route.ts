/**
 * Download email attachment
 *
 * Security:
 * - Requires authentication
 * - Rate limited
 */

import {type NextRequest, NextResponse} from "next/server"
import {requireAuth} from "@/lib/auth"
import {getAttachment} from "@/lib/imap-service"
import {checkRateLimit} from "@/lib/rate-limit"
import {RateLimitSettings} from "@/lib/settings"

// Force Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ accountId: string; uid: string; partId: string }> }
) {
    try {
        // Check authentication
        const isAuthenticated = await requireAuth()
        if (!isAuthenticated) {
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            )
        }

        const {accountId, uid, partId} = await params

        // Rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        const rateLimit = checkRateLimit(`attachment:${ip}`, RateLimitSettings.attachmentsLimit, RateLimitSettings.windowMs)

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {error: "Too many requests"},
                {status: 429}
            )
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams
        const folder = searchParams.get("folder")
        const filename = searchParams.get("filename") || "attachment"

        if (!folder) {
            return NextResponse.json(
                {error: "Folder parameter required"},
                {status: 400}
            )
        }

        const uidNum = Number.parseInt(uid, 10)
        if (isNaN(uidNum)) {
            return NextResponse.json(
                {error: "Invalid UID"},
                {status: 400}
            )
        }

        // Get attachment
        const attachment = await getAttachment({
            accountId,
            folderPath: folder,
            uid: uidNum,
            partId
        })

        if (!attachment) {
            return NextResponse.json(
                {error: "Attachment not found"},
                {status: 404}
            )
        }

        // Ensure filename is safe
        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

        console.log(`[API] Sending attachment: ${safeFilename}, size: ${attachment.content.length}, type: ${attachment.contentType}`)

        // Return attachment as download with proper headers
        // Convert Buffer to Uint8Array for NextResponse
        return new NextResponse(Buffer.from(attachment.content), {
            headers: {
                'Content-Type': attachment.contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${safeFilename}"`,
                'Content-Length': attachment.content.length.toString(),
                'Cache-Control': 'private, max-age=3600',
            },
        })
    } catch (error) {
        console.error("[API] Failed to get attachment", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return NextResponse.json(
            {error: "Failed to load attachment"},
            {status: 500}
        )
    }
}
