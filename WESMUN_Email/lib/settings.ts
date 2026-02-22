/**
 * Application Settings
 *
 * Centralized configuration hub for all adjustable application parameters.
 * This file contains all tunable settings organized by functional category.
 *
 * Benefits:
 * - Single source of truth for configuration
 * - Easy to modify behavior without code changes
 * - Type-safe settings accessible throughout the application
 * - Validated on module load to catch configuration errors early
 *
 * Usage: Import specific setting groups as needed:
 * @example
 * import { CacheSettings, RateLimitSettings } from '@/lib/settings'
 */

// ============================================================================
// CACHE SETTINGS
// ============================================================================

export const CacheSettings = {
    /**
     * Client-side cache durations (in milliseconds)
     *
     * These settings control how long data is cached in the browser's localStorage.
     * Longer durations reduce server load but may show stale data.
     * Cached data is automatically invalidated when users switch accounts or folders.
     *
     * Performance Impact:
     * - Shorter durations: More API calls, fresher data, higher server load
     * - Longer durations: Fewer API calls, potential stale data, better performance
     */
    client: {
        /**
         * Duration to cache the list of email accounts (30 minutes)
         * Accounts rarely change, so a longer cache is appropriate.
         * This prevents unnecessary authentication checks on page refresh.
         */
        accounts: 30 * 60 * 1000,

        /**
         * Duration to cache folder structures for each account (10 minutes)
         * Folders don't change frequently, but new folders might be created externally.
         * Cache is cleared when switching accounts to ensure fresh data.
         */
        folders: 10 * 60 * 1000,

        /**
         * Duration to cache email lists (3 minutes)
         * Shorter duration ensures users see new emails relatively quickly.
         * Background refresh also updates this data automatically.
         * Cache is cleared when switching folders or accounts.
         */
        emails: 3 * 60 * 1000,

        /**
         * Duration to cache individual email content (10 minutes)
         * Email content is immutable once fetched, so longer cache is safe.
         * Reduces server load when users re-read the same emails.
         */
        email: 10 * 60 * 1000,

        /**
         * Duration to cache attachment metadata (30 minutes)
         * Attachment metadata (filename, size, type) doesn't change.
         * Actual attachment content is not cached, only metadata.
         */
        attachments: 30 * 60 * 1000,
    },

    /**
     * Server-side HTTP cache headers (in seconds)
     *
     * Controls Cache-Control headers sent with API responses.
     * Browsers and CDNs use these values to cache responses.
     *
     * Two values per resource:
     * - max-age: How long the cached response is considered fresh
     * - stale-while-revalidate (SWR): How long stale data can be served while fetching fresh data in background
     *
     * SWR Strategy:
     * If cache is expired but within SWR window, browser serves stale data immediately
     * while fetching fresh data in background for next request.
     */
    server: {
        /**
         * Folders API cache max-age (10 minutes / 600 seconds)
         * Balances freshness with performance.
         * Users won't see new folders for up to 10 minutes, but this is acceptable.
         */
        foldersMaxAge: 600,

        /**
         * Email list API cache max-age (2 minutes / 120 seconds)
         * Short duration ensures users see new emails quickly.
         * Combined with background refresh for optimal UX.
         */
        emailsMaxAge: 120,

        /**
         * Individual email API cache max-age (30 minutes / 1800 seconds)
         * Email content is immutable, so aggressive caching is safe.
         * Significantly reduces server load when users re-read emails.
         */
        emailMaxAge: 1800,

        /**
         * Stale-while-revalidate window for folders (20 minutes / 1200 seconds)
         * After 10min expiry, stale folders can be shown for up to 20 more minutes
         * while background update occurs. Prevents loading spinners.
         */
        foldersSWR: 1200,

        /**
         * Stale-while-revalidate window for email lists (5 minutes / 300 seconds)
         * After 2min expiry, stale list shown while fetching fresh data.
         * Short SWR window ensures relatively fresh email lists.
         */
        emailsSWR: 300,

        /**
         * Stale-while-revalidate window for individual emails (1 hour / 3600 seconds)
         * Emails don't change, so long SWR is acceptable.
         * Background revalidation ensures cache stays fresh.
         */
        emailSWR: 3600,
    },
}

// ============================================================================
// REFRESH INTERVALS
// ============================================================================

export const RefreshSettings = {
    /**
     * Email list background refresh interval (120 seconds / 2 minutes)
     *
     * Automatically fetches fresh email list in the background without user action.
     * Ensures users see new emails without manually refreshing.
     *
     * How it works:
     * - Timer starts when email list is first loaded
     * - Every 2 minutes, silently fetches updated email list
     * - Updates UI without showing loading spinner
     * - Timer resets when user manually changes folder
     *
     * Tuning considerations:
     * - Shorter interval: More frequent updates, higher server load
     * - Longer interval: Less server load, delayed new email visibility
     * - Minimum recommended: 30 seconds (enforced by validation)
     */
    emailList: 120 * 1000,

    /**
     * Folder list background refresh interval (180 seconds / 3 minutes)
     *
     * Periodically updates folder structure and message counts in background.
     * Ensures folder counts stay reasonably up-to-date.
     *
     * Why longer than email list:
     * - Folders change less frequently than email content
     * - Fetching folder counts is more expensive (opens multiple IMAP boxes)
     * - Users care more about new emails than exact folder counts
     */
    folderList: 180 * 1000,
}

// ============================================================================
// PAGINATION SETTINGS
// ============================================================================

export const PaginationSettings = {
    /**
     * Default number of emails displayed per page (50)
     *
     * Balances between showing enough emails at once and performance.
     * Used when no explicit limit is provided in API requests.
     *
     * User experience considerations:
     * - 50 emails fits nicely on most screens without excessive scrolling
     * - Small enough to load quickly on slower connections
     * - Large enough to minimize pagination clicks
     *
     * Technical considerations:
     * - Each email requires IMAP fetch + parse operation
     * - 50 emails typically loads in 1-2 seconds on average connection
     * - Memory usage: ~5-10KB per email = 250-500KB total
     */
    defaultLimit: 50,

    /**
     * Maximum emails allowed per page (100)
     *
     * Hard limit enforced by API to prevent abuse and performance issues.
     * Client requests for more than 100 emails are automatically capped.
     *
     * Why limit at 100:
     * - Prevents malicious/buggy clients from requesting 1000s of emails
     * - IMAP servers can struggle with very large fetch operations
     * - Browser memory constraints on mobile devices
     * - Diminishing returns: users rarely browse beyond first 100 emails
     *
     * Server-side enforcement:
     * - API routes use Math.min(requestedLimit, maxLimit)
     * - Protects against both intentional and accidental overload
     */
    maxLimit: 100,
}

// ============================================================================
// PRELOADING SETTINGS
// ============================================================================

export const PreloadSettings = {
    /**
     * Number of next emails to preload ahead of current selection (2)
     *
     * Predictive loading for smoother navigation experience.
     * When user selects an email, the next 2 emails are fetched in background.
     *
     * How it improves UX:
     * - User clicks "Next" → Email loads instantly (already cached)
     * - No loading spinner between emails during sequential reading
     * - Feels like native app instead of web app
     *
     * Trade-offs:
     * - Higher: More bandwidth used, more preloaded data (potential waste)
     * - Lower: Less anticipatory loading, more loading delays
     * - Optimal: 2 emails covers most sequential reading patterns
     *
     * Implementation details:
     * - Preloading happens silently in background (no UI indication)
     * - Uses same cache as normal email fetches
     * - Failed preloads don't show errors (graceful degradation)
     */
    nextEmailsCount: 2,

    /**
     * Number of previous emails to preload behind current selection (1)
     *
     * Supports backward navigation for users who want to re-read previous email.
     * Less aggressive than forward preloading since backward navigation is rarer.
     *
     * Why only 1 previous email:
     * - Most users read emails forward (newest to oldest or vice versa)
     * - Backward navigation typically only to immediately previous email
     * - Saves bandwidth while still supporting common use case
     * - Previous emails more likely already in cache anyway
     */
    prevEmailsCount: 1,

    /**
     * Master switch to enable/disable email preloading (true)
     *
     * Global control for the entire preloading feature.
     * Can be disabled for debugging, low-bandwidth scenarios, or privacy concerns.
     *
     * When to disable:
     * - Mobile devices with strict data limits
     * - Debugging cache issues
     * - Privacy-focused environments (minimize background requests)
     * - Server load testing (isolate explicit vs implicit requests)
     *
     * When disabled:
     * - Emails only load when explicitly requested by user
     * - Slightly longer delays when navigating between emails
     * - Reduces bandwidth usage by ~20-30%
     */
    enabled: true,
}

// ============================================================================
// EMAIL DISPLAY SETTINGS
// ============================================================================

export const EmailDisplaySettings = {
    /**
     * Default view mode for emails that contain both HTML and plain text versions ('html')
     *
     * Most modern emails include both HTML (formatted) and plain text versions.
     * This setting determines which version is shown by default.
     *
     * Options:
     * - 'html': Show formatted version with images, colors, layouts
     * - 'text': Show plain text version (faster, more privacy-friendly)
     *
     * Smart detection:
     * - Email viewer auto-detects best format when both available
     * - If only one format exists, that one is shown regardless of setting
     * - Users can manually toggle between views if both exist
     *
     * Considerations:
     * - HTML: Better visual experience, potential XSS risks (mitigated by sanitize-html)
     * - Text: Faster rendering, better for accessibility, more private
     */
    defaultView: 'html' as 'html' | 'text',

    /**
     * Date format string for email headers ('PPpp')
     *
     * Controls how email timestamps are displayed in the email viewer.
     * Uses date-fns format tokens: https://date-fns.org/docs/format
     *
     * Format breakdown:
     * - 'PP': Long localized date (e.g., "Apr 29, 2025")
     * - 'pp': Long localized time (e.g., "1:30 PM")
     *
     * Examples of 'PPpp' output:
     * - "Apr 29, 2025, 1:30 PM"
     * - "Jan 15, 2025, 9:45 AM"
     * - "Dec 31, 2024, 11:59 PM"
     *
     * Alternative formats you could use:
     * - 'PPP': "April 29th, 2025"
     * - 'Pp': "Apr 29, 2025, 1:30 PM" (shorter time)
     * - 'yyyy-MM-dd HH:mm': "2025-04-29 13:30" (ISO-style)
     * - 'EEEE, MMMM do, yyyy': "Tuesday, April 29th, 2025"
     */
    dateFormat: 'PPpp',

    /**
     * Show full email addresses in addition to display names (true)
     *
     * Controls whether to show "John Doe <john@example.com>" or just "John Doe"
     * in From/To/CC fields of email viewer.
     *
     * When true (current):
     * - Full format: "John Doe <john@example.com>"
     * - Shows actual email address for verification
     * - Helps identify spoofing attempts
     * - Useful for business/security contexts
     *
     * When false:
     * - Short format: "John Doe" or "john@example.com" (whichever available)
     * - Cleaner, less cluttered display
     * - Better for personal use
     * - Takes less horizontal space
     *
     * Security consideration:
     * - Showing addresses helps users verify sender identity
     * - Important for detecting phishing/spoofing
     */
    showEmailAddresses: true,
}

// ============================================================================
// FOLDER SETTINGS
// ============================================================================

export const FolderSettings = {
    /**
     * List of folders to fetch message counts for (performance optimization)
     *
     * Only these folders will display message counts in the folder sidebar.
     * This significantly improves initial load time by avoiding expensive IMAP operations.
     *
     * Why selective counting:
     * - Fetching count for each folder requires opening the IMAP mailbox
     * - Email accounts can have 50+ folders (especially with nested structures)
     * - Opening 50 mailboxes sequentially takes 10-30 seconds
     * - Most users only care about counts for these common folders
     *
     * Included folders:
     * - INBOX: Primary incoming mail (most important)
     * - Sent: Outgoing mail tracking
     * - Drafts: Work in progress
     * - Spam/Junk: Security awareness
     * - Trash: Recently deleted (recovery opportunity)
     *
     * Excluded folders (no counts shown):
     * - Custom user folders (Archive, Projects, etc.)
     * - System folders (All Mail, Important, Starred)
     * - Nested subfolders
     *
     * Performance impact:
     * - With 6 folders: ~2-3 seconds load time
     * - With all folders (50+): ~20-30 seconds load time
     *
     * Customization:
     * Add/remove folder names as needed. Names are case-insensitive and
     * matched using includes(), so 'inbox' matches 'INBOX', '[Gmail]/Inbox', etc.
     */
    importantFolders: ['INBOX', 'Sent', 'Drafts', 'Spam', 'Trash', 'Junk'],

    /**
     * Automatically select INBOX folder when dashboard loads (true)
     *
     * Provides better UX by showing emails immediately instead of empty state.
     * Most users check INBOX first anyway, so this saves a click.
     *
     * When true (current):
     * - Dashboard loads → INBOX automatically selected → Emails visible
     * - User lands on ready-to-use interface
     * - No extra click needed to see content
     *
     * When false:
     * - Dashboard loads → No folder selected → Empty state shown
     * - User must click a folder to see any emails
     * - Gives user explicit control over first action
     */
    autoSelectInbox: true,
}

// ============================================================================
// RATE LIMITING SETTINGS
// ============================================================================

export const RateLimitSettings = {
    /**
     * Maximum requests to accounts API per time window (30 requests)
     *
     * Protects the /api/accounts endpoint from abuse.
     * This endpoint returns the list of configured email accounts.
     *
     * Why 30 requests per minute:
     * - Account list rarely changes, should be cached client-side
     * - Normal usage: 1-2 requests per page load
     * - 30 allows for aggressive page refreshing without blocking
     * - High enough for legitimate use, low enough to prevent DoS
     *
     * What happens when exceeded:
     * - HTTP 429 "Too Many Requests" returned
     * - Client must wait until window expires
     * - Applies per IP address
     */
    accountsLimit: 30,

    /**
     * Maximum requests to folders API per time window (20 requests)
     *
     * Protects the /api/accounts/[accountId]/folders endpoint.
     * This endpoint fetches folder structure and counts for an account.
     *
     * Why 20 requests per minute:
     * - Folder requests are expensive (multiple IMAP operations)
     * - Normal usage: 1 request per account switch
     * - Lower than accounts API due to higher server cost
     * - Background refresh runs every 3 minutes (20 in 60 minutes)
     *
     * Cost considerations:
     * - Each request opens multiple IMAP mailboxes
     * - Can take 2-5 seconds of server processing time
     * - Higher rate limits could overload IMAP server
     */
    foldersLimit: 20,

    /**
     * Maximum requests to emails list API per time window (20 requests)
     *
     * Protects the /api/accounts/[accountId]/emails endpoint.
     * This endpoint fetches paginated list of emails in a folder.
     *
     * Why 20 requests per minute:
     * - Moderately expensive operation (IMAP fetch + parse)
     * - Normal usage: 1 request per folder change + pagination
     * - Background refresh runs every 2 minutes (30 in 60 minutes)
     * - Allows browsing ~10 folders or 10 pages without restriction
     *
     * Typical request patterns:
     * - Initial load: 1 request
     * - Pagination (next page): 1 request
     * - Background refresh: 1 request every 2 minutes
     * - Folder change: 1 request
     */
    emailsLimit: 20,

    /**
     * Maximum requests to individual email API per time window (60 requests)
     *
     * Protects the /api/accounts/[accountId]/emails/[uid] endpoint.
     * This endpoint fetches full content of a single email.
     *
     * Why 60 requests per minute:
     * - Higher limit since users need to read multiple emails
     * - Normal usage: 1 request per email opened
     * - 60 allows reading ~1 email per second (rapid skimming)
     * - Still low enough to prevent automated scraping
     * - Email preloading counts toward this limit (2-3 extra requests per email)
     *
     * Why higher than other endpoints:
     * - Core functionality - users need to open many emails
     * - Cached aggressively (rarely re-fetched)
     * - Less server load than folder/list operations
     */
    emailLimit: 60,

    /**
     * Maximum requests to attachments API per time window (30 requests)
     *
     * Protects the /api/accounts/[accountId]/emails/[uid]/attachments/[partId] endpoint.
     * This endpoint downloads email attachments.
     *
     * Why 30 requests per minute:
     * - Attachment downloads can be large and expensive
     * - Normal usage: 0-3 attachments per email
     * - 30 allows downloading multiple emails' attachments
     * - Prevents automated bulk download tools
     *
     * Security consideration:
     * - Lower limit than emails since attachments are larger
     * - Prevents bandwidth exhaustion attacks
     * - Still sufficient for legitimate use (10 emails with 3 attachments each)
     */
    attachmentsLimit: 30,

    /**
     * Rate limit time window duration (60 seconds / 1 minute)
     *
     * The rolling time window for counting requests.
     * All rate limits use this same window for consistency.
     *
     * How it works:
     * - Window starts on first request
     * - Counts all requests in next 60 seconds
     * - Resets after 60 seconds with no requests
     *
     * Why 60 seconds:
     * - Long enough to allow bursts of legitimate activity
     * - Short enough to recover from rate limit quickly
     * - Industry standard for API rate limiting
     * - Balances protection vs usability
     *
     * Implementation note:
     * - Uses sliding window (not fixed intervals)
     * - More fair than fixed windows (no reset spike)
     * - Tracked per IP address in memory store
     */
    windowMs: 60 * 1000, // 60 seconds
}

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

export const SecuritySettings = {
    /**
     * Session timeout duration (24 hours / 86400 seconds)
     *
     * How long a user session remains valid without activity.
     * After this time, users must log in again.
     *
     * Why 24 hours:
     * - Balances security with convenience
     * - Long enough for full work day
     * - Short enough to limit exposure if session stolen
     * - Users won't be logged out during active use
     *
     * Security implications:
     * - Shorter: More secure, more annoying (constant re-login)
     * - Longer: More convenient, higher risk if session compromised
     *
     * Implementation:
     * - HTTP-only secure cookies store session ID
     * - Server validates session age on each request
     * - Expired sessions automatically redirect to login page
     */
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours

    /**
     * Maximum failed login attempts before account lockout (5 attempts)
     *
     * Prevents brute force password attacks by limiting login attempts.
     * After 5 failed attempts, the IP address is temporarily blocked.
     *
     * Why 5 attempts:
     * - Allows for typos/mistakes (2-3 attempts)
     * - Protects against automated brute force
     * - Low enough to prevent guessing, high enough to not annoy users
     *
     * What happens on lockout:
     * - IP blocked for duration specified in lockoutDuration
     * - HTTP 429 "Too Many Requests" returned
     * - Legitimate user must wait for lockout to expire
     *
     * Attack mitigation:
     * - Makes brute force attacks impractical
     * - 5 attempts = only 5 password guesses before 15min wait
     * - Slows down attackers significantly
     *
     * Note: Tracks by IP address (could affect users behind shared NAT)
     */
    maxLoginAttempts: 5,

    /**
     * Duration to block IP after exceeding login attempts (15 minutes / 900 seconds)
     *
     * How long an IP address is blocked after failed login attempts.
     * After this time, the attempt counter resets and user can try again.
     *
     * Why 15 minutes:
     * - Long enough to deter automated attacks
     * - Short enough that legitimate users aren't locked out for hours
     * - Gives user time to recover/reset password if needed
     * - Standard duration used by many services
     *
     * Security trade-offs:
     * - Shorter: Less frustrating for users, easier for attackers to retry
     * - Longer: More secure, but locks out legitimate users longer
     *
     * Implementation:
     * - Stored in memory (resets on server restart)
     * - For production, consider Redis for distributed tracking
     * - Applies per IP address globally
     */
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
}

// ============================================================================
// IMAP SETTINGS
// ============================================================================

export const ImapSettings = {
    /**
     * IMAP connection timeout duration (30 seconds / 30000 ms)
     *
     * Maximum time to wait for IMAP server connection before giving up.
     * Prevents hanging indefinitely on unresponsive servers.
     *
     * Why 30 seconds:
     * - Long enough for slow networks/servers
     * - Short enough that users don't wait forever
     * - Standard timeout for network operations
     * - Allows for DNS lookup + TCP handshake + TLS negotiation
     *
     * What happens on timeout:
     * - Connection attempt aborted
     * - Error returned to user
     * - No retry (user must manually refresh)
     *
     * Network scenarios:
     * - Fast network: Usually connects in 1-2 seconds
     * - Slow network: May take 10-15 seconds
     * - Unreachable server: Full 30 seconds before timeout
     *
     * Trade-offs:
     * - Shorter: Faster failure feedback, may time out on slow networks
     * - Longer: More patient with slow servers, users wait longer on failure
     */
    connectionTimeout: 30 * 1000, // 30 seconds

    /**
     * IMAP authentication timeout duration (10 seconds / 10000 ms)
     *
     * Maximum time to wait for authentication response after connection established.
     * Separate from connection timeout for finer control.
     *
     * Why 10 seconds:
     * - Authentication is usually fast (1-2 seconds)
     * - No DNS/network overhead (already connected)
     * - Long enough for slow IMAP servers
     * - Prevents hanging on auth server issues
     *
     * Authentication flow:
     * 1. Connection established (uses connectionTimeout)
     * 2. Send credentials
     * 3. Wait for auth response (uses authTimeout)
     * 4. Success or failure
     *
     * Common auth failures (before timeout):
     * - Invalid credentials: Immediate rejection (~1 second)
     * - Account locked: Immediate rejection (~1 second)
     * - Server overload: May take 5-8 seconds
     */
    authTimeout: 10 * 1000, // 10 seconds,
}

// ============================================================================
// UI SETTINGS
// ============================================================================

export const UISettings = {
    /**
     * Width of folder sidebar in pixels (256px / 16rem)
     *
     * Controls horizontal space allocated to folder list.
     * Balances folder visibility with content area.
     *
     * Why 256px:
     * - Wide enough for most folder names
     * - Narrow enough to leave room for emails and viewer
     * - Matches common sidebar conventions (16rem)
     * - Works on 1280px+ screens without cramping
     *
     * Typical folder names:
     * - "INBOX" - fits easily
     * - "Sent Items" - fits easily
     * - "Work/Projects/2025" - may truncate slightly
     *
     * Screen size considerations:
     * - 1920px screen: 256px is ~13% (plenty of room)
     * - 1280px screen: 256px is ~20% (acceptable)
     * - <1280px screen: May need responsive collapse
     *
     * Trade-offs:
     * - Wider: More folder names visible, less content space
     * - Narrower: More content space, truncated folder names
     */
    sidebarWidth: 256, // 16rem

    /**
     * Width of email list panel in pixels (384px / 24rem)
     *
     * Controls horizontal space for email list between folders and viewer.
     * Balances email subject visibility with email content area.
     *
     * Why 384px:
     * - Shows ~40-50 characters of subject
     * - Enough for sender name + partial subject
     * - Standard email client convention
     * - Works well on typical screens (1280px+)
     *
     * What fits in 384px:
     * - Sender name: 15-20 characters
     * - Subject preview: 30-40 characters
     * - Date/time stamp
     * - Attachment icon
     * - Unread indicator
     *
     * Layout calculation (1920px screen):
     * - Folder sidebar: 256px
     * - Email list: 384px
     * - Email viewer: 1280px (remaining)
     * - Total: 1920px ✓
     *
     * Trade-offs:
     * - Wider: More subject visible, less email content space
     * - Narrower: More email content, truncated subjects
     */
    emailListWidth: 384, // 24rem
}

// ============================================================================
// TEXT FORMATTING SETTINGS
// ============================================================================

export const TextFormattingSettings = {
    /**
     * Enable Markdown-style formatting in plain text emails (true)
     *
     * Automatically converts Markdown syntax to HTML in plain text emails.
     * Makes plain text emails more readable with basic formatting.
     *
     * What gets converted:
     * - **bold** or *italic* → <strong> or <em>
     * - [links](url) → <a href="url">links</a>
     * - `code` → <code>code</code>
     * - Line breaks preserved
     *
     * Why it's useful:
     * - Plain text emails often use Markdown-like conventions
     * - Improves readability without HTML
     * - Safe transformation (no script execution)
     * - Reversible (can toggle to plain view)
     *
     * When enabled (current):
     * - Plain text gets lightweight formatting
     * - Maintains security (no XSS risk)
     * - Better user experience
     *
     * When disabled:
     * - Strict plain text display
     * - No processing overhead
     * - See exactly what sender typed
     */
    enableMarkdownFormatting: true,

    /**
     * Automatically convert URLs to clickable links (true)
     *
     * Detects URLs in plain text and wraps them in <a> tags.
     * Users can click links instead of copying/pasting.
     *
     * Detected patterns:
     * - http://example.com
     * - https://example.com
     * - www.example.com (adds http://)
     * - ftp://files.example.com
     *
     * Security considerations:
     * - Links open in new tab (target="_blank")
     * - rel="noopener noreferrer" prevents window.opener attacks
     * - URL validation prevents JavaScript: and data: schemes
     *
     * Why enabled by default:
     * - Expected behavior in modern email clients
     * - Improves usability significantly
     * - Safe implementation with proper escaping
     *
     * When to disable:
     * - Maximum security environments
     * - Prevent accidental clicks
     * - Force users to manually verify URLs
     */
    autoLinkUrls: true,

    /**
     * Automatically convert email addresses to mailto: links (true)
     *
     * Detects email addresses and converts to clickable mailto: links.
     * Opens user's default email client when clicked.
     *
     * Detected patterns:
     * - user@example.com
     * - first.last@subdomain.example.com
     * - name+tag@example.co.uk
     *
     * What happens on click:
     * - Opens default mail client (Outlook, Gmail, etc.)
     * - Pre-fills "To" field with address
     * - User can compose reply directly
     *
     * Why useful:
     * - Quick way to respond to contacts in email
     * - Standard email client behavior
     * - No typing/copying needed
     *
     * Privacy note:
     * - Clicking mailto may reveal your email client
     * - Could expose default email address
     * - Consider disabling in high-privacy environments
     */
    autoLinkEmails: true,

    /**
     * Support bold text formatting with *bold* or **bold** (true)
     *
     * Converts asterisk-wrapped text to HTML <strong> tags.
     * Common Markdown convention for emphasis.
     *
     * Syntax patterns:
     * - **text** → <strong>text</strong>
     * - *text* → Could be bold or italic depending on supportItalic
     *
     * Example transformations:
     * - "This is **important**" → "This is <strong>important</strong>"
     * - "**WARNING:** Do not..." → "<strong>WARNING:</strong> Do not..."
     *
     * Why support this:
     * - Very common in plain text emails
     * - Markdown standard
     * - Improves readability of emphasis
     *
     * Rendering:
     * - Default browser rendering (usually bold weight)
     * - Semantic HTML (screen readers recognize emphasis)
     * - Can be styled with CSS
     */
    supportBold: true,

    /**
     * Support italic text formatting with _italic_ or *italic* (true)
     *
     * Converts underscore/asterisk-wrapped text to HTML <em> tags.
     * Common Markdown convention for subtle emphasis.
     *
     * Syntax patterns:
     * - _text_ → <em>text</em>
     * - *text* → <em>text</em> (if supportBold is false)
     *
     * Example transformations:
     * - "The term _email_ refers to..." → "The term <em>email</em> refers to..."
     * - "See _Note_ below" → "See <em>Note</em> below"
     *
     * Ambiguity with asterisks:
     * - Single asterisk could mean bold or italic
     * - Implementation prioritizes bold if both enabled
     * - Double asterisk always means bold
     *
     * Why support this:
     * - Standard Markdown syntax
     * - Common in documentation/technical emails
     * - Semantic emphasis (not just visual)
     */
    supportItalic: true,

    /**
     * Support underline text formatting with __underline__ (true)
     *
     * Converts double-underscore-wrapped text to HTML <u> tags.
     * Less common than bold/italic but occasionally used.
     *
     * Syntax pattern:
     * - __text__ → <u>text</u>
     *
     * Example transformations:
     * - "Fill in __your name__ here" → "Fill in <u>your name</u> here"
     * - "See __attachment__" → "See <u>attachment</u>"
     *
     * Why less common:
     * - Underline often confused with hyperlinks
     * - Not standard Markdown (some variants support it)
     * - Some style guides discourage underlining
     *
     * When to disable:
     * - Avoid confusion with links
     * - Strict Markdown compatibility
     * - Minimal formatting preference
     */
    supportUnderline: true,

    /**
     * Support strikethrough text formatting with ~~text~~ (true)
     *
     * Converts double-tilde-wrapped text to HTML <s> or <del> tags.
     * GitHub-flavored Markdown syntax for deleted/changed text.
     *
     * Syntax pattern:
     * - ~~text~~ → <s>text</s>
     *
     * Example transformations:
     * - "Price: ~~$100~~ $80" → "Price: <s>$100</s> $80"
     * - "Meeting at ~~2pm~~ 3pm" → "Meeting at <s>2pm</s> 3pm"
     *
     * Common use cases:
     * - Showing corrections/updates
     * - Price changes
     * - Schedule modifications
     * - Edit history inline
     *
     * Why support this:
     * - Useful for showing changes
     * - GitHub Markdown standard
     * - Clear visual indicator
     */
    supportStrikethrough: true,

    /**
     * Support code formatting with `code` or ```code``` (true)
     *
     * Converts backtick-wrapped text to HTML <code> tags.
     * Standard Markdown syntax for inline code or code blocks.
     *
     * Syntax patterns:
     * - `code` → <code>code</code> (inline)
     * - ```code``` → <pre><code>code</code></pre> (block)
     *
     * Example transformations:
     * - "Run `npm install`" → "Run <code>npm install</code>"
     * - "Variable `user.name`" → "Variable <code>user.name</code>"
     *
     * Rendering:
     * - Monospace font (Courier, Consolas, etc.)
     * - Usually gray background
     * - Preserves spaces and formatting
     *
     * Use cases:
     * - Technical emails with commands
     * - API documentation
     * - Configuration examples
     * - File paths and names
     *
     * Why important:
     * - Essential for technical communication
     * - Distinguishes code from prose
     * - Prevents auto-linking of code snippets
     */
    supportCode: true,

    /**
     * Preserve line breaks in plain text emails (true)
     *
     * Converts newline characters (\n) to HTML <br> tags.
     * Maintains paragraph structure from original email.
     *
     * Why necessary:
     * - HTML collapses multiple whitespace/newlines to single space
     * - Plain text emails rely on newlines for structure
     * - Without this, paragraphs run together
     *
     * What it does:
     * - Single newline (\n) → <br> (line break)
     * - Double newline (\n\n) → </p><p> (paragraph break)
     * - Preserves email formatting
     *
     * Example:
     * Input:
     * "Hello,\n\nHow are you?\n\nBest,\nJohn"
     *
     * Output:
     * <p>Hello,</p><p>How are you?</p><p>Best,<br>John</p>
     *
     * When false:
     * - All text runs together
     * - Paragraphs merge
     * - Unreadable output
     *
     * Should almost always be true
     */
    preserveLineBreaks: true,

    /**
     * Convert multiple consecutive spaces to non-breaking spaces (true)
     *
     * Preserves intentional spacing in plain text emails.
     * HTML normally collapses multiple spaces to one.
     *
     * Why needed:
     * - Plain text often uses spaces for alignment
     * - ASCII tables and formatting
     * - Indentation and structure
     *
     * What it does:
     * - "word1    word2" → "word1&nbsp;&nbsp;&nbsp;&nbsp;word2"
     * - Preserves visual alignment
     * - Prevents space collapse
     *
     * Use cases:
     * - ASCII art in emails
     * - Formatted tables (Name:    John)
     * - Indented lists
     * - Code snippets with indentation
     *
     * Example:
     * Input:
     * "Name:     John Smith\nAge:      30"
     *
     * Output (with preserveSpaces):
     * "Name:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;John Smith<br>Age:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;30"
     *
     * When false:
     * - Multiple spaces collapse to one
     * - Tables misalign
     * - Formatting breaks
     */
    preserveSpaces: true,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Validate settings
export function validateSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate pagination
    if (PaginationSettings.defaultLimit > PaginationSettings.maxLimit) {
        errors.push('Default limit cannot exceed max limit')
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
