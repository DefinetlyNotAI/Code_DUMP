/**
 * Logout API endpoint with CSRF protection
 * Clears the session cookie
 */

import { type NextRequest, NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth"
import { verifyCsrfToken } from "@/lib/csrf"

export async function POST(request: NextRequest) {
  try {
    // CSRF protection for logout
    const body = await request.json()
    const { csrfToken } = body

    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      console.warn("[AUTH] Logout blocked - invalid CSRF token")
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AUTH] Logout error", { error: error instanceof Error ? error.message : "Unknown error" })
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
