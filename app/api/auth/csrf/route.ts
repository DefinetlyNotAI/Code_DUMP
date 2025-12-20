/**
 * CSRF token endpoint
 * Provides CSRF tokens for state-changing operations
 */

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { setCsrfToken } from "@/lib/csrf"

export async function GET() {
  try {
    const isAuthenticated = await requireAuth()
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = await setCsrfToken()

    return NextResponse.json({ token })
  } catch (error) {
    console.error("[CSRF] Token generation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }
}
