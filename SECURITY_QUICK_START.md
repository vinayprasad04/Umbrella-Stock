# Security Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Generate Secrets (1 minute)

```bash
node -e "const crypto = require('crypto'); console.log('# Copy these to your .env.local file:\n'); console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('REFRESH_JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('INTERNAL_API_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('PUBLIC_API_KEY=usk_' + crypto.randomBytes(32).toString('hex')); console.log('\n# Also add these:'); console.log('ALLOWED_ORIGINS=http://localhost:3000'); console.log('NODE_ENV=development');"
```

### Step 2: Update .env.local (2 minutes)

Paste the generated secrets into your `.env.local` file.

### Step 3: Restart Dev Server (1 minute)

```bash
npm run dev
```

### Step 4: Test (1 minute)

```bash
# Should work normally
curl http://localhost:3000/api/stocks/top-gainers

# Try 25 times rapidly - should rate limit after 20
for i in {1..25}; do curl http://localhost:3000/api/stocks/top-gainers; done
```

Done! Your API is now protected.

---

## 🎯 What's Protected Now

✅ **Login Endpoint** - Rate limited (5/15min), no more hard-coded admin password
✅ **CRON Endpoints** - Require secret header
✅ **Public APIs** - Rate limited (20/min without API key)
✅ **Security Headers** - All responses include XSS, clickjacking protection
✅ **CORS** - Origin validation enabled

---

## 📝 How to Apply to More Endpoints

### For Public Data APIs (Anti-Scraping)

```typescript
import { withPublicSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your code
}

export default withPublicSecurity(handler);
```

### For Auth Endpoints (Login, Signup)

```typescript
import { withAuthSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your code
}

export default withAuthSecurity(handler);
```

### For Forms (Contact, Subscribe)

```typescript
import { withFormSecurity } from '@/lib/security';

async function handler(req, res) {
  // Your code
}

export default withFormSecurity(handler);
```

---

## 🔑 For Production (Vercel)

### Via Vercel Dashboard:

1. Go to project settings → Environment Variables
2. Add each variable:
   - `JWT_SECRET` = (generate new, 64+ chars)
   - `REFRESH_JWT_SECRET` = (generate new, 64+ chars)
   - `INTERNAL_API_SECRET` = (generate new, 64+ chars)
   - `PUBLIC_API_KEY` = (generate new, starts with usk_)
   - `ALLOWED_ORIGINS` = `https://your-domain.vercel.app`
   - `NODE_ENV` = `production`
3. Redeploy

### Via CLI:

```bash
# Generate production secrets
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(64).toString('hex'));"

# Add to Vercel
vercel env add JWT_SECRET production
vercel env add REFRESH_JWT_SECRET production
vercel env add INTERNAL_API_SECRET production
vercel env add PUBLIC_API_KEY production
vercel env add ALLOWED_ORIGINS production
vercel env add NODE_ENV production

# Deploy
vercel --prod
```

---

## 🛡️ Rate Limits

| Endpoint Type | Without API Key | With API Key |
|--------------|----------------|--------------|
| Public APIs | 20/minute | 1000/hour |
| Auth (Login) | 5/15 minutes | N/A |
| Forms | 10/hour | N/A |

---

## 📚 Full Documentation

- **[SECURITY_SUMMARY.md](SECURITY_SUMMARY.md)** - Overview & what to do
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Complete guide
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Migration checklist

---

## ⚠️ Important Notes

1. **Admin Password:** Hard-coded admin bypass removed. Update your admin password in MongoDB.
2. **CRON Jobs:** Now require `X-Internal-Secret` header.
3. **Production:** App will not start without proper secrets.
4. **API Keys:** Optional for public endpoints, gives 50x higher rate limit.

---

## 🆘 Common Issues

### "JWT_SECRET must be set in production"
→ Add JWT_SECRET to Vercel environment variables

### "Too many requests"
→ Expected behavior. Rate limiting is working!

### "Request origin not allowed"
→ Add your domain to ALLOWED_ORIGINS

### CRON endpoint returns "Unauthorized"
→ Add `X-Internal-Secret` header to your CRON job

---

**Need Help?** See [SECURITY_GUIDE.md](SECURITY_GUIDE.md) for detailed instructions.
