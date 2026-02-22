/**
 * CSRF token endpoint
 * Provides CSRF tokens for state-changing operations
 * Note: Accessible without authentication to support login flow
 */

import {NextRequest, NextResponse} from "next/server"
import {setCsrfToken} from "@/lib/csrf"

// Force Node.js runtime (required for cookies())
export const runtime = 'nodejs'

// Disable static optimization for this route
export const dynamic = 'force-dynamic'

// Ensure this is treated as an API route
export const revalidate = 0

export async function GET(_request: NextRequest) {
    try {
        const token = await setCsrfToken()

        return NextResponse.json(
            {token},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            }
        )
    } catch (error) {
        console.error("[CSRF] Token generation failed", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return NextResponse.json(
            {error: "Failed to generate token"},
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    }
}
