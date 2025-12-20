/**
 * Client-side cache utility
 * Uses localStorage to persist data across sessions
 */
import {CacheItem} from "@/types";


export class Cache {
    /**
     * Set cache item
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in milliseconds (default: 5 minutes)
     */
    static set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
        try {
            const item: CacheItem<T> = {
                data,
                timestamp: Date.now(),
                ttl,
            }
            localStorage.setItem(`cache:${key}`, JSON.stringify(item))
        } catch (error) {
            console.warn('[Cache] Failed to set cache item:', error)
        }
    }

    /**
     * Get cache item
     * @param key Cache key
     * @returns Cached data or null if expired/not found
     */
    static get<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(`cache:${key}`)
            if (!item) return null

            const cached: CacheItem<T> = JSON.parse(item)

            // Check if expired
            if (Date.now() - cached.timestamp > cached.ttl) {
                localStorage.removeItem(`cache:${key}`)
                return null
            }

            return cached.data
        } catch (error) {
            console.warn('[Cache] Failed to get cache item:', error)
            return null
        }
    }

    /**
     * Remove cache item
     * @param key Cache key
     */
    static remove(key: string): void {
        try {
            localStorage.removeItem(`cache:${key}`)
        } catch (error) {
            console.warn('[Cache] Failed to remove cache item:', error)
        }
    }

    /**
     * Clear all cache items
     */
    static clear(): void {
        try {
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
                if (key.startsWith('cache:')) {
                    localStorage.removeItem(key)
                }
            })
        } catch (error) {
            console.warn('[Cache] Failed to clear cache:', error)
        }
    }
}

