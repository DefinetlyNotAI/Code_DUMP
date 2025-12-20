/**
 * Application Settings
 * Centralized configuration for all adjustable parameters
 */

// ============================================================================
// CACHE SETTINGS
// ============================================================================

export const CacheSettings = {
    /**
     * Client-side cache durations (in milliseconds)
     */
    client: {
        /** Account list cache duration (30 minutes) */
        accounts: 30 * 60 * 1000,

        /** Folder list cache duration (10 minutes) */
        folders: 10 * 60 * 1000,

        /** Email list cache duration (3 minutes) */
        emails: 3 * 60 * 1000,

        /** Individual email cache duration (10 minutes) */
        email: 10 * 60 * 1000,

        /** Attachment metadata cache duration (30 minutes) */
        attachments: 30 * 60 * 1000,
    },

    /**
     * Server-side HTTP cache headers (in seconds)
     */
    server: {
        /** Accounts API cache max-age */
        accountsMaxAge: 1800, // 30 minutes

        /** Folders API cache max-age */
        foldersMaxAge: 600, // 10 minutes

        /** Emails list API cache max-age */
        emailsMaxAge: 120, // 2 minutes

        /** Individual email API cache max-age */
        emailMaxAge: 1800, // 30 minutes

        /** Stale-while-revalidate for accounts */
        accountsSWR: 3600, // 1 hour

        /** Stale-while-revalidate for folders */
        foldersSWR: 1200, // 20 minutes

        /** Stale-while-revalidate for emails */
        emailsSWR: 300, // 5 minutes

        /** Stale-while-revalidate for individual email */
        emailSWR: 3600, // 1 hour
    },
}

// ============================================================================
// REFRESH INTERVALS
// ============================================================================

export const RefreshSettings = {
    /** Email list background refresh interval (in milliseconds) */
    emailList: 120 * 1000, // 120 seconds

    /** Folder list background refresh interval (in milliseconds) */
    folderList: 180 * 1000, // 180 seconds

    /** Account list background refresh interval (in milliseconds) */
    accountList: 1800 * 1000, // 30 minutes
}

// ============================================================================
// PAGINATION SETTINGS
// ============================================================================

export const PaginationSettings = {
    /** Default emails per page */
    defaultLimit: 50,

    /** Maximum emails per page (API enforced) */
    maxLimit: 100,

    /** Minimum emails per page */
    minLimit: 10,
}

// ============================================================================
// PRELOADING SETTINGS
// ============================================================================

export const PreloadSettings = {
    /** Number of next emails to preload */
    nextEmailsCount: 2,

    /** Number of previous emails to preload */
    prevEmailsCount: 1,

    /** Enable email preloading */
    enabled: true,
}

// ============================================================================
// EMAIL DISPLAY SETTINGS
// ============================================================================

export const EmailDisplaySettings = {
    /** Default view mode for emails with both HTML and text */
    defaultView: 'html' as 'html' | 'text',

    /** Maximum length for email preview text */
    previewMaxLength: 150,

    /** Show email preview in list */
    showPreview: false,

    /** Date format for email headers */
    dateFormat: 'PPpp', // e.g., "Apr 29, 2025, 1:30 PM"

    /** Use relative dates (e.g., "2 hours ago") */
    useRelativeDates: true,

    /** Show email addresses in addition to names */
    showEmailAddresses: true,
}

// ============================================================================
// FOLDER SETTINGS
// ============================================================================

export const FolderSettings = {
    /**
     * Folders to fetch counts for (to improve performance)
     * Only these folders will show message counts
     */
    importantFolders: ['INBOX', 'Sent', 'Drafts', 'Spam', 'Trash', 'Junk'],

    /** Show unread counts for folders */
    showUnreadCounts: true,

    /** Auto-select INBOX on load */
    autoSelectInbox: true,
}

// ============================================================================
// RATE LIMITING SETTINGS
// ============================================================================

export const RateLimitSettings = {
    /** Accounts API - requests per window */
    accountsLimit: 30,

    /** Folders API - requests per window */
    foldersLimit: 20,

    /** Emails API - requests per window */
    emailsLimit: 20,

    /** Email detail API - requests per window */
    emailLimit: 60,

    /** Attachments API - requests per window */
    attachmentsLimit: 30,

    /** Rate limit window duration (in milliseconds) */
    windowMs: 60 * 1000, // 60 seconds
}

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

export const SecuritySettings = {
    /** Enable CSRF protection */
    csrfProtection: true,

    /** Session timeout (in milliseconds) */
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours

    /** Maximum login attempts before lockout */
    maxLoginAttempts: 5,

    /** Lockout duration (in milliseconds) */
    lockoutDuration: 15 * 60 * 1000, // 15 minutes

    /** Enable security headers (CSP, HSTS, etc.) */
    securityHeaders: true,
}

// ============================================================================
// IMAP SETTINGS
// ============================================================================

export const ImapSettings = {
    /** IMAP connection timeout (in milliseconds) */
    connectionTimeout: 30 * 1000, // 30 seconds

    /** Keep IMAP connection alive */
    keepAlive: false, // Serverless-compatible

    /** Enable IMAP debug logging */
    debug: false,

    /** Auto-close IMAP connections after use */
    autoClose: true,
}

// ============================================================================
// UI SETTINGS
// ============================================================================

export const UISettings = {
    /** Show loading skeletons */
    showLoadingSkeletons: true,

    /** Animation duration (in milliseconds) */
    animationDuration: 200,

    /** Enable smooth scrolling */
    smoothScrolling: true,

    /** Sidebar width (in pixels) */
    sidebarWidth: 256, // 16rem

    /** Email list width (in pixels) */
    emailListWidth: 384, // 24rem

    /** Compact mode (smaller UI elements) */
    compactMode: false,
}

// ============================================================================
// PERFORMANCE SETTINGS
// ============================================================================

export const PerformanceSettings = {
    /** Enable virtual scrolling for large lists */
    virtualScrolling: false,

    /** Debounce delay for search (in milliseconds) */
    searchDebounce: 300,

    /** Throttle delay for scroll events (in milliseconds) */
    scrollThrottle: 100,

    /** Enable request batching */
    requestBatching: false,

    /** Maximum concurrent IMAP connections */
    maxConcurrentConnections: 3,
}

// ============================================================================
// ATTACHMENT SETTINGS
// ============================================================================

export const AttachmentSettings = {
    /** Maximum attachment size to display inline (in bytes) */
    maxInlineSize: 10 * 1024 * 1024, // 10 MB

    /** Supported image types for inline display */
    inlineImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

    /** Enable attachment preview */
    enablePreview: true,

    /** Download attachments in chunks */
    chunkedDownload: true,
}

// ============================================================================
// TEXT FORMATTING SETTINGS
// ============================================================================

export const TextFormattingSettings = {
    /** Enable markdown-style formatting in plain text emails */
    enableMarkdownFormatting: true,

    /** Convert URLs to clickable links */
    autoLinkUrls: true,

    /** Convert email addresses to mailto links */
    autoLinkEmails: true,

    /** Support bold text (*bold* or **bold**) */
    supportBold: true,

    /** Support italic text (_italic_ or *italic*) */
    supportItalic: true,

    /** Support underline text (__underline__) */
    supportUnderline: true,

    /** Support strikethrough text (~~strikethrough~~) */
    supportStrikethrough: true,

    /** Support code formatting (`code` or ```code```) */
    supportCode: true,

    /** Preserve line breaks in plain text */
    preserveLineBreaks: true,

    /** Convert multiple spaces to nbsp */
    preserveSpaces: true,
}

// ============================================================================
// LOGGING SETTINGS
// ============================================================================

export const LoggingSettings = {
    /** Enable console logging */
    enableLogging: true,

    /** Log level: 'debug' | 'info' | 'warn' | 'error' */
    logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',

    /** Log IMAP operations */
    logImap: true,

    /** Log API requests */
    logApi: true,

    /** Log cache hits/misses */
    logCache: true,
}

// ============================================================================
// EXPERIMENTAL FEATURES
// ============================================================================

export const ExperimentalSettings = {
    /** Enable service worker for offline support */
    serviceWorker: false,

    /** Enable WebSocket for real-time updates */
    webSocket: false,

    /** Enable push notifications */
    pushNotifications: false,

    /** Enable PWA installation */
    pwa: false,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Validate settings
 */
export function validateSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate pagination
    if (PaginationSettings.defaultLimit > PaginationSettings.maxLimit) {
        errors.push('Default limit cannot exceed max limit')
    }

    if (PaginationSettings.defaultLimit < PaginationSettings.minLimit) {
        errors.push('Default limit cannot be less than min limit')
    }

    // Validate cache durations
    if (CacheSettings.client.emails > CacheSettings.client.folders) {
        console.warn('Warning: Email cache duration is longer than folder cache')
    }

    // Validate refresh intervals
    if (RefreshSettings.emailList < 30000) {
        errors.push('Email list refresh interval should be at least 30 seconds')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

// Validate on load
const validation = validateSettings()
if (!validation.valid) {
    console.error('[Settings] Invalid configuration:', validation.errors)
}
