// Comprehensive typed settings for the project.
// - Provides server and client-safe configuration values
// - Reads environment variables, coerces and validates them
// - Exports `settings` (server-side safe) and `clientSettings` (contains only NEXT_PUBLIC_* values)

type Nullable<T> = T | null

// --- Helpers to parse env values ---
function parseBool(v: string | undefined, defaultVal = false): boolean {
    if (v === undefined) return defaultVal
    return v.toLowerCase() === 'true'
}

function parseNumber(v: string | undefined, defaultVal: number): number {
    if (v === undefined) return defaultVal
    const n = Number(v)
    return Number.isFinite(n) ? n : defaultVal
}

function parseString(v: string | undefined, defaultVal = ''): string {
    return v === undefined ? defaultVal : v
}

// --- Types ---
export type ServerDBSettings = {
    url: Nullable<string>
    maxClients: number
    allowExitOnIdle: boolean
}

export type PreviewSettings = {
    // How many redirects to follow when previewing
    maxRedirects: number
    // Wait (ms) minimum before following a redirect (actual wait = min + random 0..jitter)
    redirectWaitMsMin: number
    redirectWaitMsJitter: number
    // Timeout for fetch used by preview (ms)
    fetchTimeoutMs: number
    // Cache-Control max-age (seconds) for preview response
    cacheSeconds: number
    // User-Agent string used when previewing
    userAgent: string
    // If true, return a loading wrapper that loads the target URL in an iframe and waits for the iframe load event
    // (useful when target relies on client-side rendering)
    waitForFullLoad: boolean
    // How long to wait (ms) for the iframe to load before showing a fallback
    waitForFullLoadTimeoutMs: number
}

export type AutoCheckSettings = {
    // Whether client auto-checker should run (client-only flag; prefixed NEXT_PUBLIC_*)
    enabled: boolean
    // Treat routes as stale after this many minutes
    staleMinutes: number
    // Session storage key prefix used to avoid re-triggering in same tab
    sessionKeyPrefix: string
    // Milliseconds delay between sequential auto-check requests
    requestDelayMs: number
    // When true, reload page only if server reported it logged (prevents unnecessary reloads)
    reloadOnlyWhenLogged: boolean
    // On mobile, reduce frequency of checks to be more conservative with battery/data
    mobileReducedFrequencyFactor?: number
}

export type ApiLimits = {
    // How many recent logs are returned by status endpoints by default
    recentRouteLogsDefaultLimit: number
    // Maximum allowed limit for recent logs (safety)
    recentRouteLogsMaxLimit: number
}

export type FeatureFlags = {
    // Mirror of NEXT_PUBLIC_DISABLE_AUTO_CHECK for convenience
    disableAutoCheck: boolean
    // Generic toggle to enable/disable dev-only controls in UI (overrides NODE_ENV)
    enableDevControls?: boolean
    // Add additional client-exposed flags here
    [key: string]: any
}

export type ServerSettings = {
    env: string
    isProduction: boolean
    isDevelopment: boolean
    isTest: boolean
    db: ServerDBSettings
    preview: PreviewSettings
    api: ApiLimits
    logging: {
        // Enable verbose DB logging (default: false)
        dbQueries: boolean
    }
    dev: {
        // Show dev controls even in production (explicit override)
        forceShowDevControls: boolean
    }
    featureFlags: FeatureFlags
    // UI/layout defaults used by server rendering or pre-rendered pages
    layout: {
        // Projects per row: desktop and mobile (one project per line on mobile if desired)
        projectsPerRowDesktop: number
        projectsPerRowMobile: number
        // Mobile breakpoint (px)
        mobileBreakpointPx: number
    }
}

export type ClientSettings = {
    autoCheck: AutoCheckSettings
    ui: {
        // Whether developer controls should be visible in the UI
        showDevControls: boolean
        // On mobile, present compact/stacked layout (true = 1 project per line on mobile)
        mobileCompactLayout: boolean
        // Minimum touch target size in px for interactive UI elements
        touchTargetMinSizePx: number
        // Enable mobile gestures like swipe to change project (client-only opt-in)
        enableMobileGestures: boolean
    }
    featureFlags: FeatureFlags
}

// --- Build server-side settings ---
const serverSettings: ServerSettings = {
    env: parseString(process.env.NODE_ENV, 'development'),
    isProduction: parseString(process.env.NODE_ENV, 'development') === 'production',
    isDevelopment: parseString(process.env.NODE_ENV, 'development') === 'development',
    isTest: parseString(process.env.NODE_ENV, 'development') === 'test',

    db: {
        url: process.env.POSTGRES_URL ?? null,
        maxClients: parseNumber(process.env.POSTGRES_MAX_CLIENTS, 5),
        // In dev we allow the pool to exit on idle to avoid hang during local dev server restarts
        allowExitOnIdle: parseString(process.env.NODE_ENV, 'development') === 'development',
    },

    preview: {
        maxRedirects: parseNumber(process.env.PREVIEW_MAX_REDIRECTS ?? process.env.PREVIEW_MAX_REDIRECTS, 3),
        redirectWaitMsMin: parseNumber(process.env.PREVIEW_REDIRECT_WAIT_MS_MIN, 3000),
        redirectWaitMsJitter: parseNumber(process.env.PREVIEW_REDIRECT_WAIT_MS_JITTER, 2000),
        fetchTimeoutMs: parseNumber(process.env.PREVIEW_FETCH_TIMEOUT_MS, 10000),
        cacheSeconds: parseNumber(process.env.PREVIEW_CACHE_SECONDS, 300),
        userAgent: parseString(process.env.PREVIEW_USER_AGENT, 'Website-Monitor-Preview/1.0'),
        // Default to waiting for full client-side load to get accurate previews
        waitForFullLoad: parseBool(process.env.PREVIEW_WAIT_FOR_FULL_LOAD, true),
        waitForFullLoadTimeoutMs: parseNumber(process.env.PREVIEW_WAIT_FOR_FULL_LOAD_TIMEOUT_MS, 10_000),
    },

    api: {
        recentRouteLogsDefaultLimit: parseNumber(process.env.RECENT_ROUTE_LOGS_DEFAULT_LIMIT, 20),
        recentRouteLogsMaxLimit: parseNumber(process.env.RECENT_ROUTE_LOGS_MAX_LIMIT, 200),
    },

    logging: {
        dbQueries: parseBool(process.env.ENABLE_DB_QUERY_LOGS, false),
    },

    dev: {
        forceShowDevControls: parseBool(process.env.FORCE_SHOW_DEV_CONTROLS, false),
    },

    featureFlags: {
        disableAutoCheck: parseBool(process.env.NEXT_PUBLIC_DISABLE_AUTO_CHECK, false),
        enableDevControls: process.env.ENABLE_DEV_CONTROLS === 'true' ? true : undefined,
    },

    layout: {
        // sensible defaults: desktop 1 per row, mobile 1 per row
        projectsPerRowDesktop: parseNumber(process.env.PROJECTS_PER_ROW_DESKTOP, 1),
        projectsPerRowMobile: parseNumber(process.env.PROJECTS_PER_ROW_MOBILE, 1),
        mobileBreakpointPx: parseNumber(process.env.MOBILE_BREAKPOINT_PX, 720),
    },
}

// --- Build client-safe settings (only expose NEXT_PUBLIC_ vars / safe derived data) ---
const clientSettings: ClientSettings = {
    autoCheck: {
        // Default: enabled unless NEXT_PUBLIC_DISABLE_AUTO_CHECK === 'true' (keeps existing behavior)
        enabled: process.env.NEXT_PUBLIC_DISABLE_AUTO_CHECK !== 'true',
        staleMinutes: parseNumber(process.env.NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES, 45),
        sessionKeyPrefix: parseString(process.env.NEXT_PUBLIC_AUTO_CHECK_SESSION_KEY_PREFIX, 'auto_check_last_attempt_'),
        requestDelayMs: parseNumber(process.env.NEXT_PUBLIC_AUTO_CHECK_REQUEST_DELAY_MS, 200),
        reloadOnlyWhenLogged: parseBool(process.env.NEXT_PUBLIC_AUTO_CHECK_RELOAD_ONLY_WHEN_LOGGED, true),
        mobileReducedFrequencyFactor: parseNumber(process.env.NEXT_PUBLIC_AUTO_CHECK_MOBILE_REDUCE_FACTOR, 2),
    },

    ui: {
        // Show dev controls on client only when not in production unless explicitly enabled
        showDevControls: (parseString(process.env.NODE_ENV, 'development') !== 'production') || parseBool(process.env.NEXT_PUBLIC_FORCE_SHOW_DEV_CONTROLS, false),
        mobileCompactLayout: parseBool(process.env.NEXT_PUBLIC_MOBILE_COMPACT_LAYOUT, true),
        touchTargetMinSizePx: parseNumber(process.env.NEXT_PUBLIC_TOUCH_TARGET_MIN_PX, 44),
        enableMobileGestures: parseBool(process.env.NEXT_PUBLIC_ENABLE_MOBILE_GESTURES, true),
    },

    featureFlags: {
        disableAutoCheck: process.env.NEXT_PUBLIC_DISABLE_AUTO_CHECK === 'true',
    },
}

// Exported settings
export const settings = serverSettings
export const clientConfig = clientSettings

// Validation helper
export function validateServerSettings(requireDb = false) {
    const problems: string[] = []
    if (requireDb && !serverSettings.db.url) {
        problems.push('POSTGRES_URL is required but not configured')
    }
    if (serverSettings.preview.fetchTimeoutMs <= 0) {
        problems.push('PREVIEW_FETCH_TIMEOUT_MS must be > 0')
    }
    if (serverSettings.api.recentRouteLogsDefaultLimit <= 0) {
        problems.push('RECENT_ROUTE_LOGS_DEFAULT_LIMIT must be > 0')
    }
    if (problems.length > 0) {
        throw new Error(`Invalid server settings:\n - ${problems.join('\n - ')}`)
    }
}

export default settings
