# Email Supervision Dashboard

A secure, read-only email supervision dashboard built with Next.js for monitoring IMAP mailboxes.

## Features

- **Read-only access** - View emails without ability to send, reply, or delete
- **Multi-account support** - Monitor multiple email accounts from one interface
- **Secure authentication** - Master password with bcrypt hashing and rate limiting
- **IMAP only** - Server-side IMAP connections, no SMTP
- **Content sanitization** - HTML emails sanitized to prevent XSS
- **Security hardened** - CSP, HSTS, CSRF protection, and more

## Security

This application is designed with security as the top priority. See [SECURITY.md](./SECURITY.md) for complete security
documentation.

**Key security features:**

- All IMAP operations server-side only
- No credentials exposed to client
- Rate limiting on all endpoints
- Comprehensive security headers
- HTML sanitization with DOMPurify
- CSRF protection for state changes

## Quick Start

### Prerequisites

- Node.js 18+
- IMAP email account(s) with credentials

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
    npm install
   ```

3. Set up configuration (see Configuration below)

4. Run development server:

   ```bash
    npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Configuration

### 1. Environment Variables

Set up environment variables (`.env.local` for development, or in Vercel dashboard for production):

```bash
# Generate with: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log)"
MASTER_PASSWORD_BCRYPT_HASH=your-bcrypt-hash-here

# Generate with: openssl rand -base64 32
SESSION_SECRET=your-random-secret-here

# IMAP Configuration (JSON format)
# Add all your email accounts in this JSON structure
IMAP_CONFIG={"accounts":[{"id":"account1","label":"Account 1","imap":{"host":"imap.example.com","port":993,"secure":true,"user":"user@example.com","password":"your-password"}}]}
```

### 2. IMAP Configuration Details

> VERY IMPORTANT: Please escape all $ signs in passwords with a backslash (`\$`) when setting environment variables

The `IMAP_CONFIG` environment variable accepts a JSON object with the following structure:

```json
{
  "accounts": [
    {
      "id": "unique-account-id",
      "label": "Display Name",
      "imap": {
        "host": "imap.example.com",
        "port": 993,
        "secure": true,
        "user": "your-email@example.com",
        "password": "your-password"
      }
    }
  ]
}
```

**Example with multiple accounts:**

```json
{
  "accounts": [
    {
      "id": "it",
      "label": "IT Department",
      "imap": {
        "host": "imap.wesmun.com",
        "port": 993,
        "secure": true,
        "user": "it@wesmun.com",
        "password": "your-app-password"
      }
    },
    {
      "id": "finance",
      "label": "Finance",
      "imap": {
        "host": "imap.wesmun.com",
        "port": 993,
        "secure": true,
        "user": "finance@wesmun.com",
        "password": "your-app-password"
      }
    }
  ]
}
```

**Common IMAP Settings:**

- **Gmail / Google Workspace (including custom domains)**:
    - Host: `imap.gmail.com`
    - Port: `993`
    - Secure: `true`
    - Note: You must enable "App Passwords" in Google Account settings

- **Outlook / Office 365 (including custom domains)**:
    - Host: `outlook.office365.com`
    - Port: `993`
    - Secure: `true`

- **Yahoo Mail**:
    - Host: `imap.mail.yahoo.com`
    - Port: `993`
    - Secure: `true`

- **Custom IMAP Server** (like your own domain's mail server):
    - Host: Your mail server hostname (e.g., `imap.yourdomain.com` or `mail.yourdomain.com`)
    - Port: Usually `993` (SSL/TLS) or `143` (STARTTLS)
    - Secure: `true` for port 993, check your server docs for port 143
    - User: Your full email address
    - Password: Your email password or app-specific password

**Important**: The IMAP_CONFIG value must be a single-line JSON string with no line breaks when set as an environment
variable.

See [SECURITY.md](./SECURITY.md) for detailed configuration instructions.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard:
  - `MASTER_PASSWORD_BCRYPT_HASH` - Your bcrypt password hash
    - `SESSION_SECRET` - Random secret for sessions
    - `IMAP_CONFIG` - Your IMAP configuration JSON (single line)
4. Deploy

### Docker

```bash
docker build -t email-supervision .
docker run -p 3000:3000 --env-file .env.local email-supervision
```

### Self-hosted

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: bcryptjs + JWT
- **IMAP**: node-imap + mailparser
- **Sanitization**: isomorphic-dompurify
- **UI**: React + Tailwind CSS + shadcn/ui
- **TypeScript**: Full type safety

## Project Structure

```
├── app/
│   ├── api/            # API routes
│   ├── login/          # Login page
│   └── page.tsx        # Dashboard
├── components/         # React components and UI
├── types/              # TypeScript types
├── lib/
│   ├── auth.ts         # Authentication
│   ├── csrf.ts         # CSRF protection
│   ├── rate-limit.ts   # Rate limiting
│   ├── ui.ts           # UI CN Function
│   ├── imap-config.ts  # IMAP configuration parsing
│   └── imap-service.ts # IMAP service
│
├── .env                # Environment variables file to be imported (git ignored)
├── proxy.ts            # Middleware
└── SECURITY.md         # Security notes
```

## Contributing

This is an open-source project. Contributions are welcome, but please:

1. Read [SECURITY.md](./SECURITY.md) first
2. Never commit credentials or secrets
3. Follow existing security patterns

## Disclaimer

This software is provided as-is with no warranty. Use at your own risk. Always review the code and security practices
before deploying in production.

## Support

For security issues, please email the maintainer directly. For other issues, open a GitHub issue.
