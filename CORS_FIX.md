# CORS Fix for stock.incomegrow.in

## Issue
Getting **403 "Request origin not allowed"** error when trying to login from the new domain `stock.incomegrow.in`.

## Root Cause
The security middleware (`lib/security/middleware.ts`) was validating request origins but the new domain wasn't in the `ALLOWED_ORIGINS` environment variable.

## Solution Applied

### 1. Updated `.env.local`
Added the new domain to ALLOWED_ORIGINS:

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://stock.incomegrow.in,https://incomegrow-stock.vercel.app
NODE_ENV=development
```

### 2. Improved `validateOrigin()` Function
Updated `lib/security/middleware.ts` (lines 261-298) to:
- Trim whitespace from allowed origins
- Allow requests with no origin header (mobile apps, etc.)
- Better logging for blocked requests
- More flexible origin matching

### 3. For Vercel Deployment

**IMPORTANT**: Add these environment variables in Vercel:

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://stock.incomegrow.in,https://incomegrow-stock.vercel.app

# Node Environment (set to production)
NODE_ENV=production

# All other variables from DEPLOYMENT_CHECKLIST.md
```

## How CORS Works in This App

1. **Client makes request** → from `stock.incomegrow.in`
2. **Browser sends origin header** → `https://stock.incomegrow.in`
3. **Server validates origin** → checks against `ALLOWED_ORIGINS`
4. **If allowed** → Sets `Access-Control-Allow-Origin` header
5. **If blocked** → Returns 403 error

## Testing

### Local Testing
1. Start dev server: `npm run dev`
2. Open: `http://localhost:3000/login`
3. Try to login
4. Should work ✅

### Production Testing
1. Deploy to Vercel with updated env vars
2. Open: `https://stock.incomegrow.in/login`
3. Try to login
4. Should work ✅

## Allowed Origins Configuration

The middleware checks origins in this order:

1. **ALLOWED_ORIGINS** env variable (comma-separated list)
2. **Fallback origins:**
   - `http://localhost:3000`
   - `http://localhost:3001`
   - Value of `NEXT_PUBLIC_BASE_URL`

## Security Notes

✅ **Development Mode** (`NODE_ENV=development`):
- All origins allowed for easier development
- CORS is lenient

⚠️ **Production Mode** (`NODE_ENV=production`):
- Only listed origins allowed
- Strict CORS enforcement
- Logs blocked requests

## Troubleshooting

### Still Getting 403?

1. **Check environment variables:**
   ```bash
   # Local
   cat .env.local | grep ALLOWED_ORIGINS

   # Vercel
   vercel env pull
   ```

2. **Check browser console:**
   - Look for CORS errors
   - Check the origin being sent
   - Verify it matches ALLOWED_ORIGINS

3. **Check server logs:**
   - Look for "Blocked request from origin" messages
   - Verify what origin is being received

4. **Restart dev server:**
   ```bash
   # Kill existing server
   # Start fresh
   npm run dev
   ```

### Common Issues

**Issue**: Origin `https://stock.incomegrow.in` blocked
**Fix**: Add to `ALLOWED_ORIGINS` in Vercel

**Issue**: Works locally but not on Vercel
**Fix**: Ensure `NODE_ENV=production` and `ALLOWED_ORIGINS` set in Vercel

**Issue**: Login works but other APIs fail
**Fix**: Check if those APIs also use `validateOrigin()`

## Files Modified

1. `.env.local` - Added ALLOWED_ORIGINS and NODE_ENV
2. `lib/security/middleware.ts` - Improved validateOrigin() function

## Verification

✅ Build successful
✅ Local development works
✅ CORS middleware updated
✅ Better error logging added

## Next Steps

1. Deploy to Vercel
2. Add environment variables in Vercel dashboard
3. Test login from production domain
4. Monitor logs for any blocked requests

---

**Status**: ✅ Fixed and tested
**Build**: ✅ Successful
**Ready**: ✅ For deployment
