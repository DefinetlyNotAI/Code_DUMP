# Security Documentation

## Overview

This email supervision dashboard is designed with security as the highest priority.
It provides **read-only** access to IMAP mailboxes through a secure web interface.

## Security Features

### Authentication

- **Master password authentication** with bcrypt hashing
- **HTTP-only cookies** prevent XSS attacks on session tokens
- **Secure session tokens** using JWT with 8-hour expiry
- **Rate limiting** prevents brute force attacks (5 attempts per 15 minutes)
- **Automatic session rotation** on login

### Authorization

- Single master password protects the entire application
- All routes require authentication except `/login`
- Middleware enforces authentication before any page access

### IMAP Security

- **Server-side only** - IMAP connections never exposed to client
- **Credentials in environment variables** - never in code or logs
- **Read-only operations** - no send, reply, delete, or modify
- **TLS connections enforced** with certificate validation
- **Connection pooling disabled** to prevent session hijacking

### Content Security

- **HTML sanitization** - All email HTML sanitized with sanitize-html before display
- **Allowed HTML tags whitelist** - Only safe formatting tags permitted
- **Content Security Policy** - Strict CSP headers on all responses
- **XSS protection** - Multiple layers prevent cross-site scripting

### Network Security

- **CSRF protection** - Double-submit cookie pattern for state changes
- **Rate limiting** - All API endpoints have rate limits
- **Clickjacking protection** - X-Frame-Options: DENY
- **HSTS** - Forces HTTPS in production
- **MIME type sniffing prevention** - X-Content-Type-Options: nosniff
- **Referrer policy** - Prevents URL leakage

### Data Protection

- **No credential logging** - Passwords and IMAP credentials never logged
- **Minimal error exposure** - Stack traces hidden in production
- **No client-side secrets** - All sensitive data stays on server
- **Secure error handling** - Generic error messages to clients

## Environment Variables

### Required Variables

```bash
# Master password hash (base64-encoded bcrypt hash)
MASTER_PASSWORD_BCRYPT_HASH=

# Session secret (generate a random string)
SESSION_SECRET=

# IMAP configuration (base64-encoded JSON)
IMAP_CONFIG=
```

### Generating MASTER_PASSWORD_HASH

The master password hash is stored as a base64-encoded bcrypt hash:

```javascript
import bcrypt from 'bcryptjs'

const hash = await bcrypt.hash('your-secure-password', 10)
const base64Hash = Buffer.from(hash).toString('base64')
console.log(base64Hash)
```

Or use the provided setup script:

```bash
node scripts/setup-password.js
```

### Generating SESSION_SECRET

```bash
openssl rand -base64 32
```

### IMAP Configuration Format

The IMAP configuration is stored as base64-encoded JSON. First, create your JSON configuration:

```json
{
  "accounts": [
    {
      "id": "unique-id",
      "label": "Account Label",
      "imap": {
        "host": "imap.example.com",
        "port": 993,
        "secure": true,
        "user": "user@example.com",
        "password": "app-password"
      }
    }
  ]
}
```

Then encode it to base64:

```javascript
const config = {
  "accounts": [...]
};
const base64Config = Buffer.from(JSON.stringify(config)).toString('base64');
console.log(base64Config);
```

Set the base64 string in your `.env` file as `IMAP_CONFIG`.

## Security Considerations

### Open Source

This codebase is designed to be open source. **No secrets are in the code** - all sensitive data must be provided via
environment variables.

> Note that the only reason a Database was not used is to minimize complexity and attack surface. All sensitive data is
> kept in memory only during runtime.
> If you require persistent storage, consider adding a secure database layer with encryption.

### Read-Only by Design

The application **cannot** send, reply, delete, or modify emails. This is enforced at multiple layers:

1. No SMTP configuration or code
2. IMAP connections are read-only
3. UI provides no action buttons
4. API endpoints only implement read operations

### Credential Management

- Use **app-specific passwords** for Gmail/O365, not main account passwords
- Rotate credentials regularly
- Use least-privilege IMAP accounts
- Monitor for suspicious login attempts

### Rate Limiting

Default rate limits:

- Login: 5 attempts per 15 minutes
- Account list: 30 per minute
- Folder list: 30 per minute
- Email list: 20 per minute
- Email detail: 30 per minute

Adjust in `lib/rate-limit.ts` as needed.

## Logging and Monitoring

### What is Logged

- Authentication events (success/failure)
- Rate limit violations
- IMAP connection events
- API errors (without sensitive data)

### What is NOT Logged

- Email contents
- Credentials or passwords
- IMAP configurations
- Full headers with sensitive data
- Session tokens

## Known Limitations

- In-memory rate limiting (use Redis for multi-instance)
- No user management (single master password)
- No audit trail for email access
- No attachment download (by design)
- Desktop-first UI (mobile not optimized)

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly. Do not open public issues for security
concerns.

## License

This is open source software provided as-is with no warranty. Use at your own risk.
