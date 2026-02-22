/**
 * Next.js middleware for authentication and security headers
 *
 * Security features:
 * - Authentication enforcement
 * - Content Security Policy (CSP)
 * - Clickjacking protection (X-Frame-Options)
 * - HSTS (HTTP Strict Transport Security)
 * - XSS protection headers
 * - MIME type sniffing prevention
 */

import type {NextRequest} from "next/server"
import {NextResponse} from "next/server"
import {getSession} from "@/lib/auth"

/**
 * Add comprehensive security headers to all responses
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy - prevents XSS attacks
    // NOTE: 'unsafe-inline' is needed for Next.js, but we sanitize all email HTML server-side
    response.headers.set(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline/eval
            "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'", // Same as X-Frame-Options
            "base-uri 'self'",
            "form-action 'self'",
        ].join("; "),
    )

    // Clickjacking protection
    response.headers.set("X-Frame-Options", "DENY")

    // HSTS - Force HTTPS (only in production)
    if (process.env.NODE_ENV === "production") {
        response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    }

    // Prevent MIME type sniffing
    response.headers.set("X-Content-Type-Options", "nosniff")

    // XSS Protection (legacy, but doesn't hurt)
    response.headers.set("X-XSS-Protection", "1; mode=block")

    // Referrer Policy - don't leak URLs
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

    // Permissions Policy - restrict browser features
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")

    return response
}

export async function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl

    // Allow public routes
    if (
        pathname === "/login" ||
        pathname.startsWith("/api/auth/login") ||
        pathname.startsWith("/api/auth/csrf") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/icon") ||
        pathname === "/wesmun.svg" ||
        pathname === "/wesmun.webp"
    ) {
        return addSecurityHeaders(NextResponse.next())
    }

    // Check authentication
    const session = await getSession()
    const isAuthenticated = session?.authenticated === true && session.expiresAt > Date.now()

    if (!isAuthenticated) {
        // Redirect to login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return addSecurityHeaders(NextResponse.redirect(loginUrl))
    }

    return addSecurityHeaders(NextResponse.next())
}
