# Vercel Deployment Guide

This guide will help you deploy Umbrella Stock to Vercel successfully.

## Pre-Deployment Checklist

### 1. Build Configuration Fixed

The following issues have been resolved:

- ✅ Removed problematic `generateBuildId: () => null` from next.config.js
- ✅ Removed `postinstall` script that patches Next.js
- ✅ Added `.vercelignore` file
- ✅ Fixed import issues in payment API routes
- ✅ Added `react-google-recaptcha-v3` package
- ✅ All TypeScript errors resolved

### 2. Required Environment Variables

You **MUST** set these environment variables in Vercel Dashboard:

#### Database
```
MONGODB_CONNECTION_URI=your_mongodb_connection_string
```

#### JWT Secrets (Required)
Generate using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
```
JWT_SECRET=your_jwt_secret_64_chars_min
REFRESH_JWT_SECRET=your_refresh_jwt_secret_64_chars_min
INTERNAL_API_SECRET=your_internal_api_secret_64_chars_min
```

#### Email Configuration (Gmail)
```
EMAIL_USER=vinay.qss@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=vinay.qss@gmail.com
```

#### Application URLs
```
NEXT_PUBLIC_BASE_URL=https://www.stock.incomegrow.in
ALLOWED_ORIGINS=https://www.stock.incomegrow.in,https://stock-incomegrow.vercel.app
```

#### Google reCAPTCHA v3
Get keys from: https://www.google.com/recaptcha/admin
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

#### Razorpay Payment Gateway
Get keys from: https://dashboard.razorpay.com/app/keys
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

#### Optional
```
NODE_ENV=production
PUBLIC_API_KEY=usk_your_public_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

## Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Fixed Vercel build issues and added policy pages"
git push origin main
```

### Step 2: Import Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** .next
   - **Install Command:** `npm install`

### Step 3: Add Environment Variables

1. In Vercel project settings, go to "Environment Variables"
2. Add ALL the required variables listed above
3. Make sure to add them for:
   - ✅ Production
   - ✅ Preview (optional)
   - ✅ Development (optional)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Check deployment logs for any errors

## Common Issues and Solutions

### Issue 1: Build fails with "Command exited with 1"

**Solution:**
- Check Vercel build logs for specific error
- Verify all environment variables are set
- Make sure MongoDB connection string is correct
- Check that all required packages are in package.json

### Issue 2: JWT_SECRET errors in production

**Solution:**
- Ensure JWT_SECRET and REFRESH_JWT_SECRET are set in Vercel
- Generate new secrets if needed using the command above
- Secrets must be at least 32 characters long

### Issue 3: MongoDB connection fails

**Solution:**
- Verify MongoDB connection string is correct
- Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Vercel)
- Ensure database user has correct permissions

### Issue 4: Email sending fails

**Solution:**
- Use Gmail App Password, not regular password
- Enable 2FA on Gmail account first
- Generate App Password at: https://myaccount.google.com/apppasswords

### Issue 5: Razorpay payment not working

**Solution:**
- Verify Razorpay keys are correct (Test vs Live mode)
- Check that NEXT_PUBLIC_RAZORPAY_KEY_ID is set as "public" variable
- Ensure RAZORPAY_KEY_SECRET is not exposed to client

### Issue 6: reCAPTCHA errors

**Solution:**
- Add your Vercel domain to reCAPTCHA allowed domains
- Verify site key matches secret key
- Check that NEXT_PUBLIC_RECAPTCHA_SITE_KEY is public

## Post-Deployment Verification

After successful deployment, verify:

1. ✅ Homepage loads correctly
2. ✅ User registration works
3. ✅ Login/logout works
4. ✅ Email verification works
5. ✅ Payment flow works (if configured)
6. ✅ API endpoints respond correctly
7. ✅ Policy pages are accessible:
   - /privacy
   - /terms
   - /disclaimer
   - /cookies
   - /cancellation-refund
   - /shipping-delivery

## Monitoring

After deployment:

1. Check Vercel Analytics for performance
2. Monitor Vercel Logs for runtime errors
3. Set up alerts for critical errors
4. Monitor MongoDB performance

## Rollback

If deployment fails:

1. Go to Vercel Dashboard
2. Find previous successful deployment
3. Click "Promote to Production"

## Support

If you continue to have issues:

1. Check Vercel build logs: Project > Deployments > [Latest] > Build Logs
2. Check runtime logs: Project > Deployments > [Latest] > Functions
3. Review this checklist again
4. Contact support with specific error messages

## Files Changed for Vercel Compatibility

- `next.config.js` - Removed problematic generateBuildId
- `package.json` - Removed postinstall script
- `.vercelignore` - Added to exclude unnecessary files
- `pages/api/payment/*.ts` - Fixed imports
- `app/pricing/page.tsx` - Fixed TypeScript error

---

**Last Updated:** October 29, 2025
