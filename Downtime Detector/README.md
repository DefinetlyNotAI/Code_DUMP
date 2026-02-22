# Website Monitoring Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://www.postgresql.org/)

A comprehensive, production-ready website monitoring and status dashboard built with Next.js, TypeScript, and PostgreSQL. Monitor multiple projects, track route health, view uptime percentages, and get real-time status updates with automatic checking capabilities.

![Status Dashboard](public/status.png)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Database](#-database)
- [Monitoring Logic](#-monitoring-logic)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Monitoring
- **Multi-Project Dashboard**: Monitor multiple websites/projects from a single interface
- **Route-Level Tracking**: Check individual API endpoints and pages within each project
- **Real-Time Status Updates**: Automated and manual status checking with instant feedback
- **Uptime Calculation**: Track uptime percentage based on recent status logs
- **Response Time Tracking**: Monitor and log response times for each request
- **Historical Logs**: Store and query historical status data in PostgreSQL

### Smart Status Detection
- **Working**: Routes with 200-299 responses and >70% uptime
- **Previous Degradations**: Routes that were previously degraded but are now healthy [Routes with 200-299 responses and <70% uptime]
- **Degraded**: Routes with 4xx errors or redirects too often
- **Broken**: Routes with connection failures (timeout/network) or 5xx server errors
- **Unknown**: Routes with no recent check data

### Intelligent Features
- **Auto-Checker**: Client-side automatic re-checking of stale routes (configurable)
- **Dynamic Route Handling**: Detects and skips placeholder routes that require parameters
- **Preview System**: Live iframe previews of monitored websites with redirect handling
- **Method Detection**: Identifies POST-only endpoints returning 405 on GET requests
- **Mobile Optimized**: Responsive design with touch-friendly controls

### Developer Experience
- **TypeScript**: Fully typed codebase with strict type checking
- **Dev Controls**: Built-in development tools for testing and debugging
- **Comprehensive Logging**: Detailed server-side logging for troubleshooting
- **Hot Reload**: Fast development with Next.js hot module replacement
- **Environment Validation**: Settings validation on startup

---

## 🏗 Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS 4
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with `pg` driver
- **UI Components**: Radix UI, Lucide Icons, shadcn/ui
- **Utilities**: date-fns, clsx, zod

### Project Structure
```
Status/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main dashboard (all projects)
│   ├── [project]/                # Project detail pages
│   │   ├── page.tsx              # Single project view
│   │   └── not-found.tsx         # 404 handler
│   └── api/                      # API routes
│       ├── updateStatus/[site]/  # Route status checker
│       ├── status/               # Get status data
│       ├── report/               # Manual check endpoint
│       └── preview/              # Website preview iframe
├── components/                   # React components
│   ├── auto-checker.tsx          # Auto-check client logic
│   ├── manual-check-button.tsx   # Manual check UI
│   ├── route-chart.tsx           # Status visualization
│   ├── status-badge.tsx          # Status indicator
│   ├── project-preview.tsx       # Website preview
│   └── ui/                       # shadcn/ui components
├── lib/                          # Core utilities
│   ├── projectData.ts            # Project & route definitions
│   ├── settings.ts               # Environment & config
│   ├── db.ts                     # PostgreSQL connection pool
│   ├── utils.ts                  # Status logic & DB queries
│   └── types.ts                  # TypeScript types
├── scripts/
│   └── setupDB.js                # Database initialization
├── docs/
│   ├── SYSTEM.md                 # System overview
│   └── SETTINGS.md               # Configuration guide
└── certs/
    └── ca.pem                    # Optional PostgreSQL CA cert

```

### Data Flow

1. **Status Check Trigger**:
   - Automated: Auto-checker detects stale routes (client-side)
   - Manual: User clicks "Check Now" button
   - Scheduled: External cron/scheduler calls API

2. **API Processing** (`/api/updateStatus/[site]`):
   - Validates project exists
   - Separates static vs. dynamic routes
   - Fetches each static route with timeout
   - Records status code and response time
   - Inserts log into PostgreSQL

3. **Status Determination** (`lib/utils.ts`):
   - Queries recent logs (default: last 20)
   - Calculates uptime percentage
   - Determines status based on error patterns
   - Returns aggregated route status

4. **UI Display**:
   - Server-side: Fetches latest status on page load
   - Client-side: Auto-checker updates stale data
   - Real-time: Status badges reflect current state

---

## 📦 Prerequisites

### Required
- **Node.js**: 18.x or higher
- **PostgreSQL**: 12.x or higher (local or cloud)
- **npm** or **pnpm**: Package manager

### Recommended
- **Vercel Account**: For easy deployment (optional)
- **Neon/Supabase**: Managed PostgreSQL for production (optional)

---

## 🚀 Quick Start

### 1. Clone the Repository
```powershell
git clone https://github.com/yourusername/status.git
cd status
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database (Required)
POSTGRES_URL=postgresql://user:password@host:5432/database?sslmode=require

# Optional Settings
NODE_ENV=development
POSTGRES_MAX_CLIENTS=5
PREVIEW_MAX_REDIRECTS=3
RECENT_ROUTE_LOGS_DEFAULT_LIMIT=20
NEXT_PUBLIC_DISABLE_AUTO_CHECK=false
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=45
```

See [docs/SETTINGS.md](docs/SETTINGS.md) for all available environment variables.

### 4. Initialize Database
```powershell
npm run db:setup
```

This creates the `status_logs` table and required indexes.

### 5. Configure Your Projects
Edit `lib/projectData.ts` to define your monitored projects:

```typescript
export const projects: Project[] = [
  {
    slug: "my-app",
    title: "My Application",
    description: "Production web application",
    visitLink: "https://myapp.com",
    routes: [
      {
        path: "/",
        title: "Home Page",
        description: "Main landing page"
      },
      {
        path: "/api/health",
        title: "Health Check",
        description: "API health endpoint"
      }
    ]
  }
]
```

### 6. Start Development Server
```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Trigger Initial Check
Manually check a project:
```powershell
curl -X POST http://localhost:3000/api/updateStatus/my-app
```

---

## ⚙ Configuration

### Project Data (`lib/projectData.ts`)

Define all monitored projects and their routes:

```typescript
{
  slug: "unique-identifier",       // URL-safe project ID
  title: "Display Name",           // Shown in UI
  description: "Project details",  // Brief description
  visitLink: "https://example.com", // Base URL
  routes: [                        // Monitored endpoints
    {
      path: "/api/endpoint",       // Route path (appended to visitLink)
      title: "Endpoint Name",      // Display name
      description: "What it does"  // Brief description
    }
  ]
}
```

**Dynamic Routes**: Routes with placeholders (e.g., `/api/users/[id]`) are automatically skipped. To monitor them, add a concrete example:
```typescript
{ path: "/api/users/123", title: "User Example", description: "Sample user endpoint" }
```

### Environment Settings

See [docs/SETTINGS.md](docs/SETTINGS.md) for comprehensive configuration options.

**Quick Reference**:
- `POSTGRES_URL`: PostgreSQL connection string (required)
- `NEXT_PUBLIC_DISABLE_AUTO_CHECK`: Disable auto-checker (`true`/`false`)
- `NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES`: Minutes before auto-recheck (default: 45)
- `PREVIEW_FETCH_TIMEOUT_MS`: Preview fetch timeout in ms (default: 10000)

### SSL/TLS Certificates

If using PostgreSQL with custom CA (e.g., Neon, Azure):
1. Place certificate in `certs/ca.pem`
2. The system automatically loads it if present

---

## 📖 Usage

### Dashboard View
- **Main Page** (`/`): Overview of all projects with status badges
- **Project Page** (`/[project-slug]`): Detailed route monitoring for one project

### Manual Checking
1. Navigate to a project page
2. Click **"Check Now"** on any route
3. Wait for status update (page auto-reloads)

### Automatic Checking
The auto-checker runs client-side and:
- Checks if any route is stale (older than `staleMinutes`)
- Triggers update API for stale routes
- Reloads page when updates complete
- Throttles requests to avoid overwhelming server

**Disable auto-checking**:
```env
NEXT_PUBLIC_DISABLE_AUTO_CHECK=true
```

### Previews
- Hover over project cards to see live preview
- Previews follow redirects (waits 3-5s)
- POST-only endpoints show "Preview unavailable"

### Developer Controls
In development mode, additional controls appear:
- Clear status logs
- Force refresh
- View raw status data

---

## 🔌 API Reference

### POST `/api/updateStatus/[site]`
Checks all routes for a project and logs status.

**Parameters**:
- `site` (path): Project slug from `projectData.ts`

**Response**:
```json
{
  "results": [
    {
      "route": "/api/health",
      "statusCode": 200,
      "responseTime": 145,
      "success": true,
      "logged": true
    }
  ],
  "summary": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "skipped": 0
  }
}
```

**Status Codes**:
- `200-299`: Success (logged as working)
- `300-399`: Redirect (logged as degraded)
- `400-499`: Client error (logged as degraded)
- `500-599`: Server error (logged as broken)
- `0`: Connection failure/timeout (logged as broken)
- `-1`: Dynamic route skipped (not logged)

### GET `/api/status`
Retrieves current status for all projects or a specific project.

**Query Parameters**:
- `project` (optional): Filter by project slug

**Response**:
```json
{
  "projects": [
    {
      "slug": "my-app",
      "title": "My Application",
      "overallStatus": "working",
      "routes": [
        {
          "path": "/api/health",
          "currentStatus": "working",
          "uptime": 100,
          "lastChecked": "2025-12-23T10:30:00Z"
        }
      ]
    }
  ]
}
```

### POST `/api/report`
Triggers manual check for specific routes.

**Body**:
```json
{
  "projectSlug": "my-app",
  "routes": ["/api/health", "/"]
}
```

### GET `/api/preview`
Returns HTML preview of a target URL.

**Query Parameters**:
- `url` (required): Target URL to preview

**Response**: HTML content suitable for iframe

---

## 🗄 Database

### Schema

#### `status_logs` Table
```sql
CREATE TABLE status_logs (
  id            BIGSERIAL PRIMARY KEY,
  project_slug  TEXT NOT NULL,
  route_path    TEXT NOT NULL,
  status_code   INTEGER NOT NULL,
  response_time INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_logs_project_route_created_at
  ON status_logs (project_slug, route_path, created_at DESC);
```

### Queries

**Insert Status Log**:
```typescript
insertStatusLog(projectSlug, routePath, statusCode, responseTime?)
```

**Get Recent Logs**:
```typescript
getRecentRouteLogs(projectSlug, routePath, limit = 20)
```

**Clear All Logs** (dev only):
```sql
DELETE FROM status_logs WHERE project_slug = $1;
```

### Maintenance

**Cleanup old logs** (example):
```sql
DELETE FROM status_logs
WHERE created_at < NOW() - INTERVAL '30 days';
```

Add to cron for automatic cleanup.

---

## 🧮 Monitoring Logic

### Status Determination Algorithm

```typescript
function determineStatus(logs: StatusLog[]) {
  // 1. Calculate uptime (% of 2xx responses)
  const uptime = (2xx_count / total_logs) * 100

  // 2. Check for critical errors
  if (has_connection_errors || has_5xx_errors)
    return "broken"

  // 3. Check for degraded state
  if (has_4xx_errors || has_3xx_redirects || uptime < 70)
    return "degraded"

  // 4. Default to working
  return "working"
}
```

### Uptime Calculation
- Based on **recent logs** (default: last 20 checks)
- Only `200-299` responses count as "up"
- Percentage rounded to nearest integer

### Response Time
- Measured in milliseconds
- Includes network + server processing time
- Stored per log for trend analysis
- 10-second timeout (configurable)

---

## 🛠 Development

### Local Development
```powershell
# Install dependencies
npm install

# Set up database
npm run db:setup

# Start dev server
npm run dev
```

### Testing Status Checks
```powershell
# Check single project
curl -X POST http://localhost:3000/api/updateStatus/my-app

# Get current status
curl http://localhost:3000/api/status?project=my-app

# Test preview
curl "http://localhost:3000/api/preview?url=https://example.com"
```

### Debugging
Enable verbose logging:
```env
ENABLE_DB_QUERY_LOGS=true
```

Check logs in terminal where `npm run dev` is running.

### Adding Components
This project uses shadcn/ui. Add new components:
```powershell
npx shadcn@latest add [component-name]
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```powershell
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables

3. **Set Environment Variables**:
   ```
   POSTGRES_URL=your_production_database_url
   ```

4. **Deploy**:
   Vercel auto-deploys on push

### Database Setup
- Use managed PostgreSQL (Neon, Supabase, Railway)
- Run `npm run db:setup` after creating database
- Or manually execute SQL from `scripts/setupDB.js`

### Environment Variables
Set in Vercel dashboard or `.env.production`:
- `POSTGRES_URL`: Production database
- `NEXT_PUBLIC_*`: Client-visible settings
- See [docs/SETTINGS.md](docs/SETTINGS.md) for all options

### Post-Deployment
1. Verify database connection
2. Trigger initial checks via API
3. Set up monitoring/alerting (optional)

---

## 🐛 Troubleshooting

### "POSTGRES_URL not configured"
**Solution**: Set `POSTGRES_URL` in `.env.local`:
```env
POSTGRES_URL=postgresql://user:pass@host:5432/dbname
```

### "Database pool not initialized"
**Solution**: Restart dev server. Ensure `POSTGRES_URL` is valid.

### Auto-checker not running
**Check**:
1. `NEXT_PUBLIC_DISABLE_AUTO_CHECK` is not `true`
2. Routes have `lastChecked` timestamp
3. Timestamp is older than `staleMinutes`

**Solution**:
```env
NEXT_PUBLIC_DISABLE_AUTO_CHECK=false
NEXT_PUBLIC_AUTO_CHECK_STALE_MINUTES=45
```

### "Site not found in monitoring data"
**Solution**: Add project to `lib/projectData.ts` with matching slug.

### SSL Certificate Errors
**Solution**: 
1. Place CA certificate in `certs/ca.pem`
2. Or use connection string with `?sslmode=require`

### High Memory Usage
**Solution**: Reduce `POSTGRES_MAX_CLIENTS`:
```env
POSTGRES_MAX_CLIENTS=3
```

### Previews Not Loading
**Check**:
1. Target URL allows iframes (no `X-Frame-Options: DENY`)
2. CORS policy permits preview endpoint
3. Increase timeout:
   ```env
   PREVIEW_FETCH_TIMEOUT_MS=15000
   ```

---

## 📚 Additional Documentation

- **[SYSTEM.md](docs/SYSTEM.md)**: System architecture and implementation details
- **[SETTINGS.md](docs/SETTINGS.md)**: Complete environment variable reference

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing TypeScript patterns
- Add types for new features
- Update documentation
- Test locally before submitting

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📞 Support

For issues and questions:
- Open a GitHub issue
- Check [docs/](docs) for detailed documentation
- Review existing issues for solutions

---

**Made with ❤️ for reliable website monitoring**

