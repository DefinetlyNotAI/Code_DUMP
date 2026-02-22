# Configuration & Settings Guide

Complete reference for all environment variables and configuration options in the Website Monitoring Dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
  - [Database Settings](#database-settings)
  - [Preview System](#preview-system)
  - [Auto-Checker (Client)](#auto-checker-client)
  - [API Limits](#api-limits)
  - [Logging](#logging)
  - [UI/Layout](#uilayout)
  - [Developer Controls](#developer-controls)
  - [Feature Flags](#feature-flags)
- [Settings Architecture](#settings-architecture)
- [Validation](#validation)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

This application uses a comprehensive settings system defined in `lib/settings.ts`. Settings are:

- **Type-safe**: All values have TypeScript types
- **Validated**: Required values are checked on startup
- **Split**: Server-only vs. client-safe values
- **Defaulted**: Sensible defaults for all optional settings

### Settings Files

- **`lib/settings.ts`**: Central configuration module
- **`.env.local`**: Local development environment variables (not committed)
- **`.env.production`**: Production environment variables (deployment only)
- **Vercel Dashboard**: Environment variables for deployed instances

---

## Environment Variables

### Database Settings

#### `POSTGRES_URL` (Required)
PostgreSQL connection string.

**Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?[options]
```

**Examples**:
```env
# Local development
POSTGRES_URL=postgresql://postgres:password@localhost:5432/status_dev

# Neon (serverless)
POSTGRES_URL=postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/status?sslmode=require

# Supabase
POSTGRES_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require

# Railway
POSTGRES_URL=postgresql://postgres:pass@containers-us-west.railway.app:7432/railway
```

**Notes**:
- Required for all database operations
- Application will fail to start if missing (when DB is required)
- Use connection pooling on production (Neon, Supabase include this)

#### `POSTGRES_MAX_CLIENTS`
Maximum concurrent database connections.

- **Type**: Number
- **Default**: `5`
- **Range**: `1-20` (recommended)

**Examples**:
```env
# Development (low traffic)
POSTGRES_MAX_CLIENTS=3

# Production (moderate traffic)
POSTGRES_MAX_CLIENTS=10

# High-traffic production
POSTGRES_MAX_CLIENTS=20
```

**Notes**:
- Too high: May exhaust database connection limits
- Too low: May cause bottlenecks under load
- Serverless databases (Neon) handle pooling automatically

---

### Preview System

Settings for the `/api/preview` endpoint that generates website previews.

#### `PREVIEW_MAX_REDIRECTS`
Maximum number of redirects to follow when previewing.

- **Type**: Number
- **Default**: `3`
- **Range**: `0-10`

```env
PREVIEW_MAX_REDIRECTS=3
```

**Use Cases**:
- `0`: Don't follow any redirects
- `1-3`: Follow authentication/login redirects
- `5+`: Follow multiple intermediate redirects

#### `PREVIEW_REDIRECT_WAIT_MS_MIN`
Minimum milliseconds to wait before following a redirect.

- **Type**: Number
- **Default**: `3000` (3 seconds)

```env
PREVIEW_REDIRECT_WAIT_MS_MIN=3000
```

**Why**: Some sites need time to load before redirecting (e.g., splash screens).

#### `PREVIEW_REDIRECT_WAIT_MS_JITTER`
Random additional wait time (0 to jitter value).

- **Type**: Number
- **Default**: `2000` (0-2 seconds)

```env
PREVIEW_REDIRECT_WAIT_MS_JITTER=2000
```

**Total Wait**: `MIN + random(0, JITTER)`
- Example: 3000 + random(0, 2000) = 3-5 seconds

#### `PREVIEW_FETCH_TIMEOUT_MS`
Timeout for fetching preview content.

- **Type**: Number
- **Default**: `10000` (10 seconds)
- **Range**: `5000-30000` recommended

```env
PREVIEW_FETCH_TIMEOUT_MS=10000
```

**Notes**:
- Increase for slow websites
- Decrease to fail fast on unreachable sites

#### `PREVIEW_CACHE_SECONDS`
Cache-Control max-age for preview responses.

- **Type**: Number
- **Default**: `300` (5 minutes)

```env
PREVIEW_CACHE_SECONDS=300
```

**Values**:
- `0`: No caching
- `60`: 1 minute (frequent updates)
- `300`: 5 minutes (default)
- `3600`: 1 hour (static sites)

#### `PREVIEW_USER_AGENT`
User-Agent string sent when fetching previews.

- **Type**: String
- **Default**: `"Website-Monitor-Preview/1.0"`

```env
PREVIEW_USER_AGENT="Website-Monitor-Preview/1.0"
```

**Custom Examples**:
```env
# Mimic browser
PREVIEW_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"

# Bot identifier
PREVIEW_USER_AGENT="StatusBot/2.0 (+https://status.example.com)"
```

#### `PREVIEW_WAIT_FOR_FULL_LOAD`
Enable client-side rendering wait (iframe load event).

- **Type**: Boolean
- **Default**: `true`

```env
PREVIEW_WAIT_FOR_FULL_LOAD=true
```

**When to disable**:
- Server-rendered sites (faster previews)
- Sites that don't use client-side JavaScript

#### `PREVIEW_WAIT_FOR_FULL_LOAD_TIMEOUT_MS`
Timeout waiting for iframe load.

- **Type**: Number
- **Default**: `10000` (10 seconds)

```env
PREVIEW_WAIT_FOR_FULL_LOAD_TIMEOUT_MS=10000
```

---

### Auto-Checker (Client)

Client-side automatic status checking. All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

#### `NEXT_PUBLIC_DISABLE_AUTO_CHECK`
Completely disable automatic checking.

- **Type**: Boolean
- **Default**: `false`

```env
# Disable auto-checking
NEXT_PUBLIC_DISABLE_AUTO_CHECK=true

# Enable auto-checking (default)
NEXT_PUBLIC_DISABLE_AUTO_CHECK=false
```

**When to disable**:
- Low-traffic sites (check manually)
- Reduce server load
- During maintenance

#### `NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES`
Minutes before a route is considered stale.

- **Type**: Number
- **Default**: `45`

```env
# Check every 30 minutes
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=30

# Check every 2 hours
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=120
```

**Recommendations**:
- **15-30**: Frequent monitoring (high-traffic APIs)
- **45-60**: Balanced (default)
- **120+**: Low-frequency monitoring

#### `NEXT_PUBLIC_AUTO_CHECK_SESSION_KEY_PREFIX`
Session storage key prefix for tracking checks.

- **Type**: String
- **Default**: `"auto_check_last_attempt_"`

```env
NEXT_PUBLIC_AUTO_CHECK_SESSION_KEY_PREFIX="auto_check_last_attempt_"
```

**Purpose**: Prevents duplicate checks in the same browser session.

#### `NEXT_PUBLIC_AUTO_CHECK_REQUEST_DELAY_MS`
Milliseconds between sequential auto-check requests.

- **Type**: Number
- **Default**: `200`

```env
# Slower (reduce server load)
NEXT_PUBLIC_AUTO_CHECK_REQUEST_DELAY_MS=500

# Faster (more responsive)
NEXT_PUBLIC_AUTO_CHECK_REQUEST_DELAY_MS=100
```

**Purpose**: Throttle requests when checking multiple routes.

#### `NEXT_PUBLIC_AUTO_CHECK_RELOAD_ONLY_WHEN_LOGGED`
Only reload page if server actually logged new data.

- **Type**: Boolean
- **Default**: `true`

```env
NEXT_PUBLIC_AUTO_CHECK_RELOAD_ONLY_WHEN_LOGGED=true
```

**When `true`**: Prevents unnecessary reloads when data hasn't changed.

#### `NEXT_PUBLIC_AUTO_CHECK_MOBILE_REDUCE_FACTOR`
Reduce check frequency on mobile devices.

- **Type**: Number
- **Default**: `2`

```env
# Check 2x less frequently on mobile
NEXT_PUBLIC_AUTO_CHECK_MOBILE_REDUCE_FACTOR=2

# Same frequency on mobile
NEXT_PUBLIC_AUTO_CHECK_MOBILE_REDUCE_FACTOR=1
```

**Purpose**: Save battery and mobile data.

---

### API Limits

#### `RECENT_ROUTE_LOGS_DEFAULT_LIMIT`
Default number of recent logs returned by status endpoints.

- **Type**: Number
- **Default**: `20`

```env
RECENT_ROUTE_LOGS_DEFAULT_LIMIT=20
```

**Affects**:
- Uptime calculation accuracy
- Status determination logic
- API response size

#### `RECENT_ROUTE_LOGS_MAX_LIMIT`
Maximum allowed limit for recent logs.

- **Type**: Number
- **Default**: `200`

```env
RECENT_ROUTE_LOGS_MAX_LIMIT=200
```

**Purpose**: Prevent excessive database queries.

---

### Logging

#### `ENABLE_DB_QUERY_LOGS`
Enable verbose database query logging.

- **Type**: Boolean
- **Default**: `false`

```env
# Development debugging
ENABLE_DB_QUERY_LOGS=true

# Production (disable for performance)
ENABLE_DB_QUERY_LOGS=false
```

**Output**:
```
[DB] insertStatusLog: project=my-app, route=/api/health, status=200
[DB] insertStatusLog: query ok, rowsAffected=1
```

---

### UI/Layout

#### `PROJECTS_PER_ROW_DESKTOP`
Number of project cards per row on desktop.

- **Type**: Number
- **Default**: `1`

```env
# One project per row (default)
PROJECTS_PER_ROW_DESKTOP=1

# Three projects per row
PROJECTS_PER_ROW_DESKTOP=3
```

**Note**: Current implementation uses Tailwind responsive grid. This setting is reserved for future use.

#### `PROJECTS_PER_ROW_MOBILE`
Number of project cards per row on mobile.

- **Type**: Number
- **Default**: `1`

```env
PROJECTS_PER_ROW_MOBILE=1
```

#### `MOBILE_BREAKPOINT_PX`
Pixel width defining mobile vs. desktop.

- **Type**: Number
- **Default**: `720`

```env
MOBILE_BREAKPOINT_PX=768
```

#### `NEXT_PUBLIC_MOBILE_COMPACT_LAYOUT`
Use compact/stacked layout on mobile.

- **Type**: Boolean
- **Default**: `true`

```env
NEXT_PUBLIC_MOBILE_COMPACT_LAYOUT=true
```

#### `NEXT_PUBLIC_TOUCH_TARGET_MIN_PX`
Minimum touch target size for mobile UI elements.

- **Type**: Number
- **Default**: `44` (iOS/Android guidelines)

```env
NEXT_PUBLIC_TOUCH_TARGET_MIN_PX=44
```

#### `NEXT_PUBLIC_ENABLE_MOBILE_GESTURES`
Enable swipe gestures on mobile.

- **Type**: Boolean
- **Default**: `true`

```env
NEXT_PUBLIC_ENABLE_MOBILE_GESTURES=true
```

**Future**: May enable swipe-to-navigate between projects.

---

### Developer Controls

#### `FORCE_SHOW_DEV_CONTROLS`
Show dev controls even in production.

- **Type**: Boolean
- **Default**: `false`

```env
# Show in production (not recommended)
FORCE_SHOW_DEV_CONTROLS=true
```

**Dev Controls Include**:
- Clear status logs button
- Force refresh
- Raw data inspection

#### `NEXT_PUBLIC_FORCE_SHOW_DEV_CONTROLS`
Client-side override for dev controls.

- **Type**: Boolean
- **Default**: `false`

```env
NEXT_PUBLIC_FORCE_SHOW_DEV_CONTROLS=true
```

**Difference**: This affects client-rendered components only.

---

### Feature Flags

#### `ENABLE_DEV_CONTROLS`
Generic toggle for development features.

- **Type**: Boolean
- **Default**: `undefined` (uses `NODE_ENV`)

```env
ENABLE_DEV_CONTROLS=true
```

---

## Settings Architecture

### Server vs. Client Settings

**Server Settings** (`lib/settings.ts` → `settings`):
- Database credentials
- API limits
- Server-side logging
- Preview settings

**Client Settings** (`lib/settings.ts` → `clientConfig`):
- Only `NEXT_PUBLIC_*` variables
- UI preferences
- Auto-checker configuration

### Import Pattern

```typescript
// Server components / API routes
import settings from '@/lib/settings'
console.log(settings.db.url) // OK

// Client components
import { clientConfig } from '@/lib/settings'
console.log(clientConfig.autoCheck.enabled) // OK
```

### Type System

All settings are fully typed:

```typescript
type ServerSettings = {
  env: string
  isProduction: boolean
  db: ServerDBSettings
  preview: PreviewSettings
  // ...
}

type ClientSettings = {
  autoCheck: AutoCheckSettings
  ui: UISettings
  featureFlags: FeatureFlags
}
```

---

## Validation

### Startup Validation

The `validateServerSettings()` function runs on application start:

```typescript
validateServerSettings(requireDb: boolean)
```

**Checks**:
- Database URL presence (if `requireDb = true`)
- Positive timeout values
- Valid limits

**Failure**: Throws error with detailed message.

### Example Error

```
Invalid server settings:
 - POSTGRES_URL is required but not configured
 - PREVIEW_FETCH_TIMEOUT_MS must be > 0
```

---

## Best Practices

### Development

```env
# .env.local (not committed)
NODE_ENV=development
POSTGRES_URL=postgresql://postgres:password@localhost:5432/status_dev
POSTGRES_MAX_CLIENTS=3
ENABLE_DB_QUERY_LOGS=true
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=15
```

### Staging

```env
NODE_ENV=production
POSTGRES_URL=postgresql://user:pass@staging-db.example.com/status_staging
POSTGRES_MAX_CLIENTS=5
ENABLE_DB_QUERY_LOGS=false
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=30
```

### Production

```env
NODE_ENV=production
POSTGRES_URL=postgresql://user:pass@prod-db.example.com/status
POSTGRES_MAX_CLIENTS=10
ENABLE_DB_QUERY_LOGS=false
PREVIEW_CACHE_SECONDS=600
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=60
NEXT_PUBLIC_DISABLE_AUTO_CHECK=false
```

### Security

1. **Never commit `.env` files**: Add to `.gitignore`
2. **Use environment-specific files**: `.env.local`, `.env.production`
3. **Rotate credentials**: Update `POSTGRES_URL` periodically
4. **Limit client exposure**: Only `NEXT_PUBLIC_*` vars are safe for client

### Performance

1. **Tune connection pool**:
   ```env
   POSTGRES_MAX_CLIENTS=5  # Start low, increase if needed
   ```

2. **Optimize cache**:
   ```env
   PREVIEW_CACHE_SECONDS=600  # 10 minutes for static sites
   ```

3. **Reduce auto-check frequency**:
   ```env
   NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=60  # 1 hour
   ```

---

## Examples

### Minimal Setup (Local Dev)

```env
POSTGRES_URL=postgresql://postgres:password@localhost:5432/status
```

All other settings use defaults.

### High-Frequency Monitoring

```env
POSTGRES_URL=postgresql://user:pass@db.example.com/status?sslmode=require
POSTGRES_MAX_CLIENTS=10
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=15
RECENT_ROUTE_LOGS_DEFAULT_LIMIT=50
PREVIEW_CACHE_SECONDS=60
```

### Low-Traffic / Manual Checks Only

```env
POSTGRES_URL=postgresql://user:pass@db.example.com/status
POSTGRES_MAX_CLIENTS=3
NEXT_PUBLIC_DISABLE_AUTO_CHECK=true
PREVIEW_CACHE_SECONDS=3600
```

### Debugging Configuration

```env
POSTGRES_URL=postgresql://postgres:password@localhost:5432/status
ENABLE_DB_QUERY_LOGS=true
FORCE_SHOW_DEV_CONTROLS=true
NEXT_PUBLIC_FORCE_SHOW_DEV_CONTROLS=true
PREVIEW_FETCH_TIMEOUT_MS=30000
```

### Production Optimized

```env
NODE_ENV=production
POSTGRES_URL=postgresql://user:pass@prod-db.example.com/status?sslmode=require
POSTGRES_MAX_CLIENTS=15
ENABLE_DB_QUERY_LOGS=false
PREVIEW_CACHE_SECONDS=600
PREVIEW_FETCH_TIMEOUT_MS=8000
RECENT_ROUTE_LOGS_DEFAULT_LIMIT=30
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=45
NEXT_PUBLIC_AUTO_CHECK_REQUEST_DELAY_MS=300
NEXT_PUBLIC_AUTO_CHECK_MOBILE_REDUCE_FACTOR=2
```

---

## Environment Variable Reference Table

| Variable | Type | Default | Required | Scope |
|----------|------|---------|----------|-------|
| `POSTGRES_URL` | String | - | ✅ | Server |
| `POSTGRES_MAX_CLIENTS` | Number | 5 | ❌ | Server |
| `PREVIEW_MAX_REDIRECTS` | Number | 3 | ❌ | Server |
| `PREVIEW_REDIRECT_WAIT_MS_MIN` | Number | 3000 | ❌ | Server |
| `PREVIEW_REDIRECT_WAIT_MS_JITTER` | Number | 2000 | ❌ | Server |
| `PREVIEW_FETCH_TIMEOUT_MS` | Number | 10000 | ❌ | Server |
| `PREVIEW_CACHE_SECONDS` | Number | 300 | ❌ | Server |
| `PREVIEW_USER_AGENT` | String | Website-Monitor-Preview/1.0 | ❌ | Server |
| `PREVIEW_WAIT_FOR_FULL_LOAD` | Boolean | true | ❌ | Server |
| `PREVIEW_WAIT_FOR_FULL_LOAD_TIMEOUT_MS` | Number | 10000 | ❌ | Server |
| `RECENT_ROUTE_LOGS_DEFAULT_LIMIT` | Number | 20 | ❌ | Server |
| `RECENT_ROUTE_LOGS_MAX_LIMIT` | Number | 200 | ❌ | Server |
| `ENABLE_DB_QUERY_LOGS` | Boolean | false | ❌ | Server |
| `FORCE_SHOW_DEV_CONTROLS` | Boolean | false | ❌ | Server |
| `PROJECTS_PER_ROW_DESKTOP` | Number | 1 | ❌ | Server |
| `PROJECTS_PER_ROW_MOBILE` | Number | 1 | ❌ | Server |
| `MOBILE_BREAKPOINT_PX` | Number | 720 | ❌ | Server |
| `NEXT_PUBLIC_DISABLE_AUTO_CHECK` | Boolean | false | ❌ | Client |
| `NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES` | Number | 45 | ❌ | Client |
| `NEXT_PUBLIC_AUTO_CHECK_SESSION_KEY_PREFIX` | String | auto_check_last_attempt_ | ❌ | Client |
| `NEXT_PUBLIC_AUTO_CHECK_REQUEST_DELAY_MS` | Number | 200 | ❌ | Client |
| `NEXT_PUBLIC_AUTO_CHECK_RELOAD_ONLY_WHEN_LOGGED` | Boolean | true | ❌ | Client |
| `NEXT_PUBLIC_AUTO_CHECK_MOBILE_REDUCE_FACTOR` | Number | 2 | ❌ | Client |
| `NEXT_PUBLIC_MOBILE_COMPACT_LAYOUT` | Boolean | true | ❌ | Client |
| `NEXT_PUBLIC_TOUCH_TARGET_MIN_PX` | Number | 44 | ❌ | Client |
| `NEXT_PUBLIC_ENABLE_MOBILE_GESTURES` | Boolean | true | ❌ | Client |
| `NEXT_PUBLIC_FORCE_SHOW_DEV_CONTROLS` | Boolean | false | ❌ | Client |

---

## Troubleshooting Settings

### Settings Not Loading

**Symptom**: Changes to `.env.local` not reflected.

**Solutions**:
1. Restart dev server (`npm run dev`)
2. Check file is named exactly `.env.local` (not `.env.local.txt`)
3. Verify variable names (case-sensitive)

### Client Variables Not Available

**Symptom**: `NEXT_PUBLIC_*` variables are `undefined` in client.

**Solutions**:
1. Ensure prefix is `NEXT_PUBLIC_`
2. Restart dev server (Next.js inlines these at build time)
3. Check browser console for actual value

### Database Connection Fails

**Symptom**: "POSTGRES_URL not configured" or connection errors.

**Solutions**:
1. Verify `.env.local` exists and contains `POSTGRES_URL`
2. Test connection string with `psql` or database client
3. Check SSL requirements (`?sslmode=require`)
4. Verify CA certificate in `certs/ca.pem` if needed

### Type Errors in Settings

**Symptom**: TypeScript errors when accessing settings.

**Solutions**:
1. Import correct settings object:
   - Server: `import settings from '@/lib/settings'`
   - Client: `import { clientConfig } from '@/lib/settings'`
2. Check property exists in type definition
3. Restart TypeScript server in IDE

---

## Migration Guide

### From Environment Variables to Settings Module

**Before**:
```typescript
const dbUrl = process.env.POSTGRES_URL
const maxClients = Number(process.env.POSTGRES_MAX_CLIENTS || 5)
```

**After**:
```typescript
import settings from '@/lib/settings'

const dbUrl = settings.db.url
const maxClients = settings.db.maxClients
```

**Benefits**:
- Type safety
- Validated defaults
- Centralized configuration

---

## Related Documentation

- [README.md](../README.md): General project documentation
- [SYSTEM.md](SYSTEM.md): Architecture and implementation details
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**Last Updated**: December 23, 2025

