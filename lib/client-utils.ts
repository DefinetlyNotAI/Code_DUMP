/**
 * Client-side utility functions for email processing
 * Moves processing from server to client for better performance
 */

import {EmailAddress, EmailDetail} from "@/types"

/**
 * Format email addresses for display (client-side)
 */
export function formatEmailAddresses(addresses: EmailAddress[] | undefined): string {
    if (!addresses || addresses.length === 0) return ""

    return addresses
        .map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address)
        .join(", ")
}

/**
 * Format email address for short display (client-side)
 */
export function formatEmailAddressShort(addresses: EmailAddress[] | undefined): string {
    if (!addresses || addresses.length === 0) return "Unknown"

    const first = addresses[0]
    const name = first.name || first.address?.split("@")[0] || "Unknown"

    if (addresses.length > 1) {
        return `${name} +${addresses.length - 1}`
    }

    return name
}

/**
 * Extract plain text preview from HTML (client-side)
 */
export function extractTextPreview(html: string | undefined, maxLength: number = 150): string {
    if (!html) return ""

    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, " ")

    // Decode HTML entities
    const decoded = text
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")

    // Clean up whitespace
    const cleaned = decoded.replace(/\s+/g, " ").trim()

    // Truncate
    if (cleaned.length > maxLength) {
        return cleaned.substring(0, maxLength) + "..."
    }

    return cleaned
}

/**
 * Check if email has attachments (client-side check)
 */
export function hasAttachments(email: EmailDetail): boolean {
    return email.hasAttachments || (email.attachments && email.attachments.length > 0) || false
}

/**
 * Format file size for display (client-side)
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"

    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Sanitize HTML on client-side (lightweight version)
 */
export function sanitizeHtmlClient(html: string): string {
    // Create a temporary div to parse HTML
    const temp = document.createElement("div")
    temp.innerHTML = html

    // Remove script tags
    const scripts = temp.querySelectorAll("script")
    scripts.forEach(script => script.remove())

    // Remove event handlers
    const allElements = temp.querySelectorAll("*")
    allElements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith("on")) {
                el.removeAttribute(attr.name)
            }
        })
    })

    return temp.innerHTML
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function (...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false

    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

/**
 * Preload next/previous emails for faster navigation
 */
export function preloadEmails(
    accountId: string,
    folder: string,
    uids: number[]
): void {
    uids.forEach(uid => {
        const url = `/api/accounts/${accountId}/emails/${uid}?folder=${encodeURIComponent(folder)}`

        // Use fetch with low priority
        fetch(url, {priority: "low"} as any).catch(() => {
            // Ignore errors for preloading
        })
    })
}

