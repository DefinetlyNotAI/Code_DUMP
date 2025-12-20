/**
 * Client-side utility functions for email processing
 * Moves processing from server to client for better performance
 */

import {EmailAddress} from "@/types"

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

