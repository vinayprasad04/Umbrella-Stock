# Security Implementation Guide
## Umbrella Stock API Security

This guide covers the comprehensive security implementation for the Umbrella Stock application, including anti-scraping protection for public APIs.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Quick Setup](#quick-setup)
3. [Security Features](#security-features)
4. [Environment Configuration](#environment-configuration)
5. [Applying Security to Endpoints](#applying-security-to-endpoints)
6. [Rate Limiting](#rate-limiting)
7. [API Key System](#api-key-system)
8. [CORS Configuration](#cors-configuration)
9. [Security Headers](#security-headers)
10. [Internal API Protection](#internal-api-protection)
11. [Migration Guide](#migration-guide)
12. [Troubleshooting](#troubleshooting)

---

## Security Overview

### What's Implemented

✅ **Authentication & Authorization**
- JWT-based authentication with access and refresh tokens
- Role-based access control (ADMIN, DATA_ENTRY, USER, SUBSCRIBER)
- Secure password hashing with bcrypt (12 rounds)
- Token validation on all protected endpoints

✅ **Rate Limiting**
- Strict rate limiting on authentication endpoints (5 requests/15 minutes)
- Moderate rate limiting on forms (10 requests/hour)
- Mandatory API key authentication for public APIs:
  - With valid API key: 1000 requests/hour
  - Without API key: **Access denied immediately**

✅ **CORS Protection**
- Origin validation for allowed domains
- Preflight request handling
- Credential support for authenticated requests

✅ **Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS) in production
- Referrer-Policy
- Permissions-Policy

✅ **Anti-Scraping Protection**
- **Mandatory API key authentication** - No anonymous access
- Rate limiting: 1000 requests/hour with valid API key
- Request logging and monitoring
- Complete protection against unauthorized scraping

✅ **Internal API Security**
- Secret-based authentication for CRON jobs
- Server-to-server authentication
- Secure webhook handling

---

## Quick Setup

### 1. Generate Secrets

Run this command to generate secure secrets:

```bash
node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('REFRESH_JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('INTERNAL_API_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('PUBLIC_API_KEY=usk_' + crypto.randomBytes(32).toString('hex'));"
```

### 2. Update Environment Variables

Add the generated secrets to your `.env.local` file:

```env
# Security Configuration
JWT_SECRET=<generated-secret-from-step-1>
REFRESH_JWT_SECRET=<generated-secret-from-step-1>
INTERNAL_API_SECRET=<generated-secret-from-step-1>
PUBLIC_API_KEY=<generated-key-from-step-1>

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.vercel.app

# Node Environment
NODE_ENV=development
```

### 3. Deploy to Production

For Vercel/Production:

```bash
# Add environment variables via Vercel dashboard or CLI
vercel env add JWT_SECRET
vercel env add REFRESH_JWT_SECRET
vercel env add INTERNAL_API_SECRET
vercel env add PUBLIC_API_KEY
vercel env add ALLOWED_ORIGINS
vercel env add NODE_ENV # Set to "production"
```

---

## Security Features

### 1. JWT Secret Validation

The system now validates JWT secrets on startup:

- **Development**: Warns if using default secrets but allows operation
- **Production**: Throws error if secrets are not configured or too weak
- **Minimum Length**: Secrets must be at least 32 characters (recommended: 64)

### 2. Removed Security Vulnerabilities

❌ **REMOVED**: Hard-coded admin credentials
- Previous: `vinay.qss@gmail.com` with password `654321`
- Now: All users (including admins) use hashed passwords

❌ **REMOVED**: Default JWT secrets in code
- Now: Validated on startup with clear warnings

❌ **REMOVED**: Unprotected CRON endpoints
- Now: Requires `X-Internal-Secret` header

### 3. Rate Limiting Tiers

**Strict** (Auth Endpoints):
- 5 requests per 15 minutes
- Endpoints: login, signup, forgot-password

**Moderate** (Forms):
- 10 requests per hour
- Endpoints: contact, subscribe

**Standard** (General API):
- 100 requests per minute
- Endpoints: User profile, settings

**Public** (Data APIs):
- With Valid API Key: 1000 requests/hour
- Without API Key: **BLOCKED** (Access denied)
- Endpoints: stocks, mutual funds, ETFs, search
- **API Key is MANDATORY for all public endpoints**

---

## Environment Configuration

### Required Variables

```env
# JWT Configuration (REQUIRED)
JWT_SECRET=<64-character-hex-string>
REFRESH_JWT_SECRET=<64-character-hex-string>

# Internal API Security (REQUIRED for CRON)
INTERNAL_API_SECRET=<64-character-hex-string>

# Public API (OPTIONAL - for higher rate limits)
PUBLIC_API_KEY=usk_<32-character-hex-string>

# CORS (REQUIRED for production)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Environment
NODE_ENV=production
```

### Optional Variables

```env
# Custom Rate Limits (if you want to override defaults)
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW=900000  # 15 minutes in ms

RATE_LIMIT_PUBLIC_WITH_KEY_MAX=1000
RATE_LIMIT_PUBLIC_WITHOUT_KEY_MAX=20
```

---

## Applying Security to Endpoints

### Public API Endpoints (Anti-Scraping)

Use `withPublicSecurity` for public data endpoints:

```typescript
// pages/api/stocks/top-gainers.ts
import { withPublicSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your endpoint logic
  res.json({ data: stocks });
}

export default withPublicSecurity(handler);
```

**Features:**
- Rate limiting (20/min without key, 1000/hour with key)
- CORS headers
- Security headers
- Automatic OPTIONS handling

### Authentication Endpoints

Use `withAuthSecurity` for login/signup/password reset:

```typescript
// pages/api/auth/login.ts
import { withAuthSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your auth logic
}

export default withAuthSecurity(handler);
```

**Features:**
- Strict rate limiting (5 per 15 minutes)
- Origin validation
- CORS headers
- Security headers

### Form Endpoints

Use `withFormSecurity` for contact/subscribe forms:

```typescript
// pages/api/contact.ts
import { withFormSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your form logic
}

export default withFormSecurity(handler);
```

**Features:**
- Moderate rate limiting (10 per hour)
- Origin validation
- CORS headers
- Security headers
- Anti-spam protection

### Internal/CRON Endpoints

Use `withInternalSecurity` for CRON jobs:

```typescript
// pages/api/cron/sync.ts
import { withInternalSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your cron logic
}

export default withInternalSecurity(handler);
```

**Features:**
- Requires `X-Internal-Secret` header
- No rate limiting (trusted)
- Security headers
- Request logging

### Basic Security

For endpoints that need minimal security:

```typescript
import { withBasicSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your logic
}

export default withBasicSecurity(handler);
```

---

## Rate Limiting

### How It Works

Rate limiting is based on:
- **IP Address**: From `X-Forwarded-For` or socket
- **User Agent Hash**: MD5 hash of user agent (first 8 characters)
- **Combined Key**: `{ip}:{uaHash}`

This prevents:
- Brute force attacks
- Denial of Service (DoS)
- Data scraping
- API abuse

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests, please try again later.",
  "retryAfter": 600
}
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-10-16T12:30:00.000Z
Retry-After: 600
```

### Custom Rate Limiting

For custom rate limits:

```typescript
import { rateLimit, RateLimitPresets } from '@/lib/security';

export default async function handler(req, res) {
  // Apply custom rate limit
  const allowed = await rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 requests
    message: 'Custom rate limit message'
  })(req, res);

  if (!allowed) return;

  // Your logic
}
```

---

## API Key System

### For Public Endpoints

Public endpoints support optional API keys for higher rate limits.

### Using API Keys

**Client Side:**
```javascript
fetch('https://api.yourdomain.com/api/stocks/top-gainers', {
  headers: {
    'X-API-Key': 'usk_your_api_key_here'
  }
})
```

**Without API Key:**
- **ACCESS DENIED** - API key is mandatory for all public endpoints
- Response: `401 Unauthorized - API key required`

**With Valid API Key:**
- Rate limit: 1000 requests per hour
- Full access to all public data endpoints

### Generating API Keys

```bash
node -e "console.log('usk_' + require('crypto').randomBytes(32).toString('hex'))"
```

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 2025-10-16T13:00:00.000Z
```

---

## CORS Configuration

### Setup

Configure allowed origins in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com,https://www.your-domain.com
```

### Behavior

**Development:**
- Allows all origins for easier testing

**Production:**
- Only allows origins in `ALLOWED_ORIGINS`
- Rejects requests from unauthorized origins

### CORS Headers

```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
Access-Control-Allow-Headers: Content-Type,Authorization,X-API-Key
Access-Control-Max-Age: 86400
```

---

## Security Headers

All responses include security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevents MIME type sniffing |
| X-Frame-Options | DENY | Prevents clickjacking |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer info |
| Permissions-Policy | geolocation=(), microphone=(), camera=() | Restricts browser features |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Forces HTTPS (production only) |

---

## Internal API Protection

### CRON Jobs

CRON endpoints require internal secret:

```bash
curl -X POST https://api.yourdomain.com/api/cron/init \
  -H "X-Internal-Secret: your_internal_api_secret"
```

**Without Secret:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Server-to-Server Calls

Use internal secret for all server-to-server communication:

```typescript
fetch('https://api.yourdomain.com/api/internal/sync', {
  headers: {
    'X-Internal-Secret': process.env.INTERNAL_API_SECRET
  }
})
```

---

## Migration Guide

### Step 1: Update Existing Endpoints

For each endpoint, wrap the handler with appropriate security:

**Before:**
```typescript
export default async function handler(req, res) {
  // logic
}
```

**After (Public API):**
```typescript
import { withPublicSecurity } from '@/lib/security';

async function handler(req, res) {
  // logic
}

export default withPublicSecurity(handler);
```

### Step 2: Priority Endpoints to Update

**High Priority (Do First):**
1. ✅ `/api/auth/login` - Already updated
2. ✅ `/api/cron/init` - Already updated
3. `/api/auth/signup`
4. `/api/auth/forgot-password`
5. `/api/auth/reset-password`

**Medium Priority (Public APIs):**
6. `/api/stocks/**`
7. `/api/mutual-funds/**`
8. `/api/search`
9. `/api/etfs`

**Low Priority (Forms):**
10. `/api/subscribe`
11. `/api/contact`

### Step 3: Test Each Endpoint

After updating, test:

1. **Rate Limiting**: Make rapid requests to trigger rate limit
2. **API Keys**: Test with and without API key
3. **CORS**: Test from different origins
4. **Security Headers**: Check response headers

### Step 4: Monitor Logs

Watch for security warnings:

```
⚠️  SECURITY WARNING: JWT_SECRET is not set or using default value
⚠️  Unauthorized internal API access attempt from: 192.168.1.100
[SECURITY] 2025-10-16T12:00:00.000Z - Rate limit exceeded
```

---

## Troubleshooting

### Issue: "JWT_SECRET must be set in production"

**Solution:**
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to environment
vercel env add JWT_SECRET
# Paste the generated secret

# Redeploy
vercel --prod
```

### Issue: "Rate limit exceeded"

**Cause:** Too many requests from same IP

**Solutions:**
1. Wait for the window to reset (check `Retry-After` header)
2. Use API key for higher limits
3. Contact admin to whitelist your IP

### Issue: "Request origin not allowed"

**Cause:** CORS configuration

**Solution:**
```bash
# Add your origin to allowed origins
vercel env add ALLOWED_ORIGINS
# Enter: https://your-domain.com,https://www.your-domain.com

# Redeploy
vercel --prod
```

### Issue: "Internal API not configured"

**Cause:** Missing INTERNAL_API_SECRET

**Solution:**
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to environment
vercel env add INTERNAL_API_SECRET

# Update cron job to include header
curl -X POST https://api.yourdomain.com/api/cron/init \
  -H "X-Internal-Secret: <your-secret>"
```

---

## Security Checklist

Before deploying to production:

- [ ] JWT_SECRET set (64+ characters)
- [ ] REFRESH_JWT_SECRET set (64+ characters)
- [ ] INTERNAL_API_SECRET set (64+ characters)
- [ ] PUBLIC_API_KEY set (optional but recommended)
- [ ] ALLOWED_ORIGINS configured with production domain
- [ ] NODE_ENV set to "production"
- [ ] All authentication endpoints updated with security middleware
- [ ] All public endpoints updated with anti-scraping protection
- [ ] All CRON endpoints protected with internal secret
- [ ] Hard-coded credentials removed
- [ ] Security headers verified in browser
- [ ] Rate limiting tested
- [ ] CORS tested from production domain
- [ ] Monitoring/logging configured

---

## Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## Support

For security issues or questions:
- Email: security@yourdomain.com
- Report vulnerabilities: security@yourdomain.com (responsible disclosure)

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
