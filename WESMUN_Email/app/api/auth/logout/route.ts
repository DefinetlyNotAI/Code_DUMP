/**
 * Logout API endpoint with CSRF protection
 * Clears the session cookie
 */

import {type NextRequest, NextResponse} from "next/server"
import {clearSessionCookie} from "@/lib/auth"
import {requireCsrfProtection} from "@/lib/csrf"

// Force Node.js runtime (required for cookies())
export const runtime = 'nodejs'

// Disable static optimization for this route
export const dynamic = 'force-dynamic'

// Ensure this is treated as an API route
export const revalidate = 0

export async function POST(request: NextRequest) {
    try {
        // CSRF protection for logout
        const csrfCheck = await requireCsrfProtection(request)
        if (csrfCheck.error) return csrfCheck.error

        await clearSessionCookie()

        return NextResponse.json(
            {success: true},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    } catch (error) {
        console.error("[AUTH] Logout error", {error: error instanceof Error ? error.message : "Unknown error"})
        return NextResponse.json(
            {error: "Logout failed"},
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    }
}
