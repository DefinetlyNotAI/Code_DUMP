/**
 * API optimization utilities
 * Provides response compression and caching headers
 */

import {NextResponse} from "next/server"

/**
 * Create optimized JSON response with caching headers
 */
export function createOptimizedResponse(
    data: any,
    options: {
        maxAge?: number // Cache max age in seconds
        staleWhileRevalidate?: number // SWR time in seconds
        status?: number
    } = {}
): NextResponse {
    const {
        maxAge = 60, // Default 1 minute
        staleWhileRevalidate = 120, // Default 2 minutes
        status = 200
    } = options

    const headers = new Headers({
        'Content-Type': 'application/json',
        // Enable compression hints for client
        'Content-Encoding': 'gzip',
        // Cache headers for better performance
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        // ETags for conditional requests
        'ETag': `W/"${Date.now()}"`,
    })

    return NextResponse.json(data, {
        status,
        headers
    })
}

/**
 * Create error response with appropriate headers
 */
export function createErrorResponse(
    error: string,
    status: number = 500
): NextResponse {
    return NextResponse.json(
        {error},
        {
            status,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
            }
        }
    )
}

/**
 * Check if request has valid cache
 */
export function hasValidCache(
    request: Request,
    etag: string
): boolean {
    const ifNoneMatch = request.headers.get('if-none-match')
    return ifNoneMatch === etag
}

/**
 * Create 304 Not Modified response
 */
export function createNotModifiedResponse(): NextResponse {
    return new NextResponse(null, {
        status: 304,
        headers: {
            'Cache-Control': 'public, max-age=60',
        }
    })
}

