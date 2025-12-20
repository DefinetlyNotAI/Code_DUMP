/**
 * CSRF token endpoint
 * Provides CSRF tokens for state-changing operations
 * Note: Accessible without authentication to support login flow
 */

import {NextResponse} from "next/server"
import {setCsrfToken} from "@/lib/csrf"

export async function GET() {
    try {

        const token = await setCsrfToken()

        return NextResponse.json({token})
    } catch (error) {
        console.error("[CSRF] Token generation failed", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return NextResponse.json({error: "Failed to generate token"}, {status: 500})
    }
}
