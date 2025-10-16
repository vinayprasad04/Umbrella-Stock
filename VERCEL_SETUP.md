# Vercel Environment Variables Setup Guide

This guide will help you configure environment variables for your application on Vercel.

## Required Environment Variables

When deploying to Vercel, you need to set up the following environment variables:

### 1. Application Base URL
```
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```
**Important:** Replace `your-domain.vercel.app` with your actual Vercel deployment URL.

### 2. Email Configuration (Gmail)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

**How to get Gmail App Password:**
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled
4. Go to "App passwords" section
5. Select "Mail" and "Other (Custom name)"
6. Enter "Umbrella Stock App" as the name
7. Click "Generate"
8. Copy the 16-character password (this is your `EMAIL_PASS`)

**Documentation:** https://support.google.com/accounts/answer/185833

### 3. Admin Email
```
ADMIN_EMAIL=admin@yourdomain.com
```
This email will receive notifications from the contact form.

### 4. MongoDB Connection
```
MONGODB_CONNECTION_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```
Your MongoDB Atlas connection string.

### 5. Security Configuration (CRITICAL)

**Generate these secrets using:**
```bash
node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('REFRESH_JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('INTERNAL_API_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('PUBLIC_API_KEY=usk_' + crypto.randomBytes(32).toString('hex'));"
```

**Required Security Variables:**
```
JWT_SECRET=<64-character-hex-string>
REFRESH_JWT_SECRET=<64-character-hex-string>
INTERNAL_API_SECRET=<64-character-hex-string>
PUBLIC_API_KEY=usk_<32-character-hex-string>
ALLOWED_ORIGINS=https://your-domain.vercel.app,https://www.your-domain.vercel.app
NODE_ENV=production
```

**IMPORTANT:**
- JWT secrets must be at least 64 characters long
- Never use default or weak secrets in production
- Keep INTERNAL_API_SECRET private (for CRON jobs only)
- PUBLIC_API_KEY is optional but recommended for API access control

### 6. Other API Keys (if applicable)
```
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
RAPID_API_KEY=your_rapid_api_key
```

## How to Add Environment Variables on Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. Go to your project on Vercel dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. For each variable:
   - Enter the variable name (e.g., `NEXT_PUBLIC_BASE_URL`)
   - Enter the value (e.g., `https://your-domain.vercel.app`)
   - Select which environments to apply to (Production, Preview, Development)
   - Click "Save"

### Method 2: Using Vercel CLI

1. Install Vercel CLI if not already installed:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link your project:
```bash
vercel link
```

4. Add environment variables one by one:
```bash
vercel env add NEXT_PUBLIC_BASE_URL
# When prompted, enter the value and select environments

vercel env add EMAIL_USER
# Enter your Gmail address

vercel env add EMAIL_PASS
# Enter your Gmail App Password

vercel env add ADMIN_EMAIL
# Enter admin email address

vercel env add MONGODB_CONNECTION_URI
# Enter your MongoDB connection string
```

### Method 3: Pull Existing Variables

If you want to pull production environment variables to your local machine:

```bash
vercel env pull .env.local
```

This will download all environment variables from Vercel to your local `.env.local` file.

## Important Notes

### Environment Variable Types

**Public Variables (NEXT_PUBLIC_*):**
- These are embedded in the client-side JavaScript bundle
- Accessible in both server and client components
- Can be seen by users in browser
- Example: `NEXT_PUBLIC_BASE_URL`

**Private Variables:**
- Only available on the server-side
- Never exposed to the client
- Secure for API keys and secrets
- Examples: `EMAIL_USER`, `EMAIL_PASS`, `MONGODB_CONNECTION_URI`

### After Adding Variables

1. **Redeploy your application** for changes to take effect:
   - Automatic: Push new commit to trigger deployment
   - Manual: Go to Deployments → Click "..." → "Redeploy"

2. **Verify the deployment:**
   - Test signup/subscribe functionality
   - Check that email verification links use the correct domain
   - Verify emails are being sent successfully

## Testing Email Verification URLs

After deployment, test the complete flow:

1. **Subscribe via Footer:**
   - Go to your deployed site
   - Enter email in footer subscription form
   - Check email inbox for verification link
   - Verify the URL starts with your Vercel domain (not localhost)

2. **User Signup:**
   - Create a new account
   - Check email for verification link
   - Verify the URL points to your Vercel domain

## Troubleshooting

### Email Verification Links Still Show Localhost

**Solution:**
1. Check that `NEXT_PUBLIC_BASE_URL` is set correctly in Vercel
2. Ensure you redeployed after adding the variable
3. Clear browser cache and test again

### Emails Not Being Sent

**Solution:**
1. Verify `EMAIL_USER` and `EMAIL_PASS` are correct
2. Ensure you're using Gmail App Password (not regular password)
3. Check Vercel deployment logs for errors

### Gmail App Password Not Working

**Solution:**
1. Ensure 2-Step Verification is enabled on your Google account
2. Generate a new App Password
3. Update the `EMAIL_PASS` variable in Vercel
4. Redeploy the application

## Security Best Practices

1. **Never commit `.env.local` to git** - It's already in `.gitignore`
2. **Use different credentials for production and development**
3. **Rotate App Passwords periodically**
4. **Use Vercel's built-in encryption** for sensitive variables
5. **Limit access to production environment variables**

## Quick Reference Commands

```bash
# View all environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local

# Remove an environment variable
vercel env rm VARIABLE_NAME

# Add a new environment variable
vercel env add VARIABLE_NAME
```

## Need Help?

- Vercel Environment Variables Docs: https://vercel.com/docs/environment-variables
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
