Overview

This repository implements a simple website monitoring/dashboard system. The core pieces are:

- projectData: defines monitored projects, visitLink and route paths (lib/projectData.ts)
- updateStatus API: polls configured routes and inserts status logs into the DB (app/api/updateStatus/[site]/route.ts)
- preview API: fetches a target URL and returns a preview HTML to render inside an iframe (app/api/preview/route.ts)
- UI: project list, per-route status, manual checks and a mini preview (components/*)
- DB: status_logs table (inserted via insertStatusLog in lib/utils.ts)

What dictates a route's state

- Recent logs (status_codes) are read from the DB (getRecentRouteLogs).
- determineStatusFromLogs (lib/utils.ts) computes:
    - uptime: percentage of recent logs with status 200-399
    - currentStatus:
        - "broken" when there are connection errors (status_code === 0) or server errors (>= 500)
        - "degraded" when there are client errors (4xx) or uptime < 90%
        - "working" otherwise
        - "unknown" when there are no logs

How checks work

- updateStatus endpoint (POST /api/updateStatus/[site]):
    - Loads routes for the project from projectData.
    - Skips dynamic placeholder routes (those containing `[...`] and records a skipped entry in the results (statusCode
      -1).
    - For static routes it performs a GET request with a 10s timeout and:
        - Inserts a status log with the returned numeric status code.
        - Records success true when response.ok is true (2xx).
        - Records a methodMismatch flag when response.status === 405 (so callers can detect endpoints that expect POST).
    - For connection/fetch errors we insert status 0 (connection error) and set success: false.

Notes about dynamic routes

- Routes with placeholders (e.g. /api/accounts/[accountId]/emails/[uid]) cannot be checked directly — they require a
  concrete parameter. The system currently skips them and marks them as skipped in the API response.
- If you want to monitor a dynamic endpoint, add a concrete sample path to projectData (for example, replace or
  supplement the placeholder path with a concrete sample such as `/api/accounts/1/emails/1`). Alternatively, we can add
  a per-project mapping of dynamic route -> sample params; ask if you'd like this.

Preview behavior

- The preview endpoint will detect 3xx redirects and, if a redirect is returned, will wait 3-5 seconds before following
  the Location header (up to 3 redirects). This is intended to allow previews for sites that immediately redirect to
  e.g. login pages.
- If the final target returns 405 Method Not Allowed, the preview will show a readable HTML explaining that preview is
  not available for non-GET endpoints.

UI behavior and notifications

- Manual checks (the "Check Now" button) POST to the report/check API and reload the page when complete.
- To avoid spamming users with application-level popups for site status codes, the UI will not show a destructive toast
  when a site returns a non-2xx status; toasts are reserved for internal/application errors (e.g., network failure to
  the API, unexpected exceptions).

How to run and test locally

1. Start dev server:

```powershell
npm install
npm run dev
```

2. Trigger an updateStatus run for a project (replace `slugs` as in lib/projectData.ts):

```powershell
curl -X POST http://localhost:3000/api/updateStatus/wesmun-email
```

3. Manual check from UI:

- Open project in the web UI and click "Check Now" for a route. It will perform the check and reload the page.

4. Preview tests:

- Open a project's preview and observe that if the site redirects, the preview may wait 3-5s before showing the
  redirected page.
- If the endpoint is a non-GET API that returns 405, preview will explain that preview isn't available.

Additions & Next steps

- Add sample params for dynamic routes: implement an optional `samples` mapping in `projectData` so specific dynamic
  routes can be checked.
- Add content-based detection for placeholder pages: some platforms return 200 with a placeholder page for missing
  params; we could inspect the returned HTML body for keywords to detect placeholder responses.
- Improve reporting: surface `methodMismatch` flags in the UI and allow re-checking with POST if a route is known to be
  POST-only.

If you'd like I can implement any of the above next (e.g., sample mappings or POST re-checks).
