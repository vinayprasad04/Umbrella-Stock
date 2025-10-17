# Production Security Setup Guide
## Fix: Login Working in Postman (Production)

## 🔴 Problem

Your production login at `https://umbrella-stock.vercel.app/api/auth/login` is accessible from Postman without origin validation because `NODE_ENV=production` is not set.

---

## ✅ Solution: Complete Production Security Setup

### Step 1: Generate All Secrets (2 minutes)

Run this command to generate all required secrets:

```bash
node -e "const crypto = require('crypto'); console.log('\n=== Copy these to Vercel Environment Variables ===\n'); console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('\nREFRESH_JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('\nINTERNAL_API_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('\nPUBLIC_API_KEY=usk_' + crypto.randomBytes(32).toString('hex')); console.log('\n=== Also Add These ===\n'); console.log('NODE_ENV=production'); console.log('ALLOWED_ORIGINS=https://umbrella-stock.vercel.app'); console.log('NEXT_PUBLIC_BASE_URL=https://umbrella-stock.vercel.app');"
```

**Save this output!** You'll need it in the next step.

---

### Step 2: Add Environment Variables to Vercel (5 minutes)

#### Via Vercel Dashboard (Recommended):

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: **umbrella-stock**

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Add Each Variable:**

   **Critical Security Variables:**

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `NODE_ENV` | `production` | Production ✅ |
   | `ALLOWED_ORIGINS` | `https://umbrella-stock.vercel.app` | Production ✅ |
   | `JWT_SECRET` | `<generated-64-char-hex>` | Production ✅ |
   | `REFRESH_JWT_SECRET` | `<generated-64-char-hex>` | Production ✅ |
   | `INTERNAL_API_SECRET` | `<generated-64-char-hex>` | Production ✅ |
   | `PUBLIC_API_KEY` | `usk_<generated-32-char-hex>` | Production ✅ |
   | `NEXT_PUBLIC_BASE_URL` | `https://umbrella-stock.vercel.app` | Production ✅ |

   **Email Configuration:**

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `EMAIL_USER` | `your-gmail@gmail.com` | Production ✅ |
   | `EMAIL_PASS` | `<gmail-app-password>` | Production ✅ |
   | `ADMIN_EMAIL` | `admin@yourdomain.com` | Production ✅ |

   **Database:**

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `MONGODB_CONNECTION_URI` | `mongodb+srv://...` | Production ✅ |

4. **Click "Save" after each variable**

---

### Step 3: Redeploy Application (2 minutes)

After adding all environment variables:

#### Option A: Via Dashboard
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"..."** menu → **Redeploy**
4. Wait for deployment to complete

#### Option B: Via Git Push
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

#### Option C: Via Vercel CLI
```bash
vercel --prod
```

---

## 🧪 Testing After Deployment

### Test 1: Postman WITHOUT Origin Header (Should FAIL)

```
POST https://umbrella-stock.vercel.app/api/auth/login
Headers:
  Content-Type: application/json
Body:
  {
    "email": "your-email@example.com",
    "password": "your-password"
  }
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Request origin not allowed"
}
```

✅ **If you get this error, security is working correctly!**

---

### Test 2: Postman WITH Origin Header (Should WORK)

```
POST https://umbrella-stock.vercel.app/api/auth/login
Headers:
  Content-Type: application/json
  Origin: https://umbrella-stock.vercel.app
Body:
  {
    "email": "your-email@example.com",
    "password": "your-password"
  }
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

✅ **If login succeeds with Origin header, security is working correctly!**

---

### Test 3: From Website (Should WORK)

Go to: https://umbrella-stock.vercel.app/login

Try logging in with your credentials.

**Expected:** ✅ Login should work normally because browser automatically sends correct Origin header.

---

### Test 4: Rate Limiting (Should WORK)

Try logging in with wrong password 6 times rapidly:

**Expected After 5 Attempts (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Too many authentication attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

✅ **If rate limited after 5 attempts, security is working correctly!**

---

## 🔍 Verify Environment Variables

After deployment, check if environment variables are set:

### Via Vercel CLI:
```bash
vercel env ls
```

Should show:
```
NODE_ENV             Production
ALLOWED_ORIGINS      Production
JWT_SECRET          Production
REFRESH_JWT_SECRET  Production
INTERNAL_API_SECRET Production
PUBLIC_API_KEY      Production
...
```

---

## 🔒 What Changes After Setup

### Before (Current State):
- ❌ `NODE_ENV` not set or set to development
- ❌ Origin validation bypassed in production
- ❌ Anyone can access login from Postman/curl
- ❌ No CORS protection
- ✅ Rate limiting works (5/15min)

### After (Secure State):
- ✅ `NODE_ENV=production` enforced
- ✅ Origin validation active
- ✅ Only allowed origins can access
- ✅ Full CORS protection
- ✅ Rate limiting works (5/15min)
- ✅ Security headers on all responses

---

## 🎯 Security Checklist

After completing setup, verify:

- [ ] `NODE_ENV=production` is set on Vercel
- [ ] `ALLOWED_ORIGINS` includes your production domain
- [ ] All JWT secrets are set (64+ characters)
- [ ] `INTERNAL_API_SECRET` is set
- [ ] `PUBLIC_API_KEY` is set
- [ ] Application redeployed after adding env vars
- [ ] Postman request WITHOUT origin header fails with 403
- [ ] Postman request WITH origin header works
- [ ] Website login works normally
- [ ] Rate limiting kicks in after 5 attempts
- [ ] Security headers present in responses

---

## 🆘 Troubleshooting

### Issue: "Request origin not allowed" on website login

**Solution:** Make sure `ALLOWED_ORIGINS` includes your exact domain:
```
ALLOWED_ORIGINS=https://umbrella-stock.vercel.app
```

If you have multiple domains (www, non-www):
```
ALLOWED_ORIGINS=https://umbrella-stock.vercel.app,https://www.umbrella-stock.vercel.app
```

---

### Issue: "JWT_SECRET must be set in production"

**Solution:**
1. Generate a 64+ character secret
2. Add it to Vercel environment variables
3. Redeploy

---

### Issue: Still works in Postman after setup

**Possible causes:**
1. `NODE_ENV` not set correctly
2. Deployment didn't complete
3. Browser cache (clear and try again)

**Check:**
```bash
# View deployment logs
vercel logs <deployment-url>

# Check if env var is set
vercel env pull .env.production
cat .env.production | grep NODE_ENV
```

---

## 📊 Expected Behavior Summary

| Scenario | Without Setup | With Setup |
|----------|--------------|------------|
| Postman (no origin) | ✅ Works | ❌ Blocked (403) |
| Postman (with origin) | ✅ Works | ✅ Works |
| Website login | ✅ Works | ✅ Works |
| curl (no origin) | ✅ Works | ❌ Blocked (403) |
| Rate limit (5 attempts) | ✅ Works | ✅ Works |
| Security headers | ✅ Present | ✅ Present |

---

## 🚀 After Setup

Your production API will be:
1. **Protected from unauthorized access** - Origin validation enforced
2. **Rate limited** - Max 5 login attempts per 15 minutes
3. **CORS protected** - Only allowed origins can access
4. **Header secured** - XSS, clickjacking protection
5. **Fully monitored** - Rate limit headers on every response

---

**Next Steps:**
1. Generate secrets (copy the output)
2. Add to Vercel dashboard
3. Redeploy
4. Test all 4 scenarios above
5. Check off the security checklist

**Estimated Time:** 10-15 minutes

---

**Last Updated:** 2025-10-16
**Status:** Ready to implement
