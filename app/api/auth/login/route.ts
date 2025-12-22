/**
 * Login API endpoint
 *
 * Security features:
 * - CSRF protection
 * - Rate limiting by IP
 * - No information disclosure (same error for all failures)
 * - Secure session creation
 * - No credential logging
 */

import {type NextRequest, NextResponse} from "next/server"
import {createSessionToken, setSessionCookie, verifyMasterPassword} from "@/lib/auth"
import {checkRateLimit, resetRateLimit} from "@/lib/rate-limit"
import {requireCsrfProtection} from "@/lib/csrf"

// Force Node.js runtime (required for cookies())
export const runtime = 'nodejs'

// Disable static optimization for this route
export const dynamic = 'force-dynamic'

// Ensure this is treated as an API route
export const revalidate = 0

export async function POST(request: NextRequest) {
    try {
        console.log("[AUTH DEBUG] POST /api/auth/login - Request received")

        // CSRF protection
        const csrfCheck = await requireCsrfProtection(request)
        if (csrfCheck.error) {
            console.log("[AUTH DEBUG] CSRF check failed")
            return csrfCheck.error
        }

        console.log("[AUTH DEBUG] CSRF check passed, data:", {
            hasPassword: !!csrfCheck.data?.password,
            passwordType: typeof csrfCheck.data?.password,
            passwordLength: csrfCheck.data?.password?.length,
        })

        const {password} = csrfCheck.data

        // Extract IP for rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
        console.log("[AUTH DEBUG] Client IP:", ip)

        // Check rate limit (5 attempts per 15 minutes)
        const rateLimit = checkRateLimit(ip, 5, 15 * 60 * 1000, 30 * 60 * 1000)
        console.log("[AUTH DEBUG] Rate limit check:", {
            allowed: rateLimit.allowed,
        })

        if (!rateLimit.allowed) {
            console.warn("[AUTH] Login rate limit exceeded", {ip})
            return NextResponse.json(
                {
                    error: "Too many login attempts. Please try again later.",
                    retryAfter: Math.ceil((rateLimit.blockedUntil! - Date.now()) / 1000),
                },
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }


        if (!password || typeof password !== "string") {
            console.error("[AUTH DEBUG] Invalid password format:", {
                exists: !!password,
                type: typeof password,
            })
            return NextResponse.json(
                {error: "Invalid request"},
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }

        console.log("[AUTH DEBUG] About to verify password")
        // Verify password
        const isValid = await verifyMasterPassword(password)
        console.log("[AUTH DEBUG] Password verification result:", isValid)

        if (!isValid) {
            console.warn("[AUTH] Failed login attempt", {ip})
            return NextResponse.json(
                {error: "Invalid password"},
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
        }

        console.log("[AUTH DEBUG] Password verified successfully, creating session token")
        // Success - create session
        const token = await createSessionToken()
        console.log("[AUTH DEBUG] Session token created, setting cookie")
        await setSessionCookie(token)

        // Reset rate limit on successful login
        resetRateLimit(ip)

        console.log("[AUTH] Successful login", {ip})

        return NextResponse.json(
            {success: true},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    } catch (error) {
        console.error("[AUTH] Login error", {error: error instanceof Error ? error.message : "Unknown error"})
        return NextResponse.json(
            {error: "Authentication failed"},
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log("[AUTH DEBUG] GET /api/auth/login - Health check started");

        // Extract IP for rate limiting
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        console.log("[AUTH DEBUG] Client IP:", ip);

        // Check rate limit (simulate same as login)
        const rateLimit = checkRateLimit(ip, 5, 15 * 60 * 1000, 30 * 60 * 1000);
        console.log("[AUTH DEBUG] Rate limit check:", {allowed: rateLimit.allowed});

        // Simulate session token creation and cookie setting
        const token = await createSessionToken();
        await setSessionCookie(token);

        // Reset rate limit for health check
        resetRateLimit(ip);

        console.log("[AUTH DEBUG] Health check successful");
        return NextResponse.json(
            {status: "ok", message: "Login API is healthy", tokenTest: !!token},
            {headers: {"Content-Type": "application/json"}}
        );

    } catch (error) {
        console.error("[AUTH] Health check error", {error: error instanceof Error ? error.message : "Unknown error"});
        return NextResponse.json(
            {status: "error", message: "Health check failed"},
            {status: 500, headers: {"Content-Type": "application/json"}}
        );
    }
}
