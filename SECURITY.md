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

- **HTML sanitization** - All email HTML sanitized with DOMPurify before display
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
# Master password hash (generate with bcryptjs)
MASTER_PASSWORD_BCRYPT_HASH=

# Session secret (generate a random string)
SESSION_SECRET=

# IMAP configuration (JSON format)
IMAP_CONFIG=
```

### Generating MASTER_PASSWORD_HASH

```javascript
import bcrypt from 'bcryptjs'

const hash = await bcrypt.hash('your-secure-password', 10)
console.log(hash)
```

### Generating SESSION_SECRET

```bash
openssl rand -base64 32
```

### IMAP Configuration Format

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
