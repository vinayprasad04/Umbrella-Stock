# 🚨 SECURITY INCIDENT - Exposed Credentials

**Date**: October 29, 2025
**Status**: URGENT - Credentials Compromised
**Repository**: vinayprasad04/Umbrella-Stock

## ⚠️ Exposed Secrets

GitGuardian detected the following secrets exposed on GitHub:

1. ✗ **MongoDB URI** - Database connection string with password
2. ✗ **reCAPTCHA Key** - Google reCAPTCHA secret key

## 🔥 IMMEDIATE ACTIONS REQUIRED

### Step 1: Rotate MongoDB Credentials (CRITICAL - Do This First!)

**URGENT**: Your database is exposed! Anyone can access your entire database!

1. **Login to MongoDB Atlas**:
   - Go to: https://cloud.mongodb.com/

2. **Change Database Password**:
   - Click on "Database Access"
   - Find user: `root`
   - Click "Edit"
   - Click "Edit Password"
   - Generate a new strong password (click "Autogenerate Secure Password")
   - **COPY THE NEW PASSWORD IMMEDIATELY** (you won't see it again)
   - Click "Update User"

3. **Update Your Connection String**:
   ```bash
   # OLD (COMPROMISED - DO NOT USE):
   mongodb+srv:
   # NEW (with new password):
   mongodb+srv:
   ```

### Step 2: Rotate reCAPTCHA Keys

1. **Go to Google reCAPTCHA Admin**:
   - Visit: https://www.google.com/recaptcha/admin

2. **Delete Old Keys** (Compromised):
   - Site Key: ``
   - Secret Key: ``

3. **Create New reCAPTCHA v3 Site**:
   - Click "+" to create new site
   - Label: "IncomeGrow Stock - New"
   - Type: reCAPTCHA v3
   - Domains: `stock.incomegrow.in`, `localhost`
   - Accept terms
   - Click "Submit"
   - **COPY BOTH KEYS**

### Step 3: Update Local Environment

1. **Update `.env.local`** (DO NOT COMMIT THIS FILE):
   ```bash
   # MongoDB with NEW password
   MONGODB_CONNECTION_URI=mongo?retryWrites=true&w=majority

   # NEW reCAPTCHA keys
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_NEW_SITE_KEY
   RECAPTCHA_SECRET_KEY=YOUR_NEW_SECRET_KEY

   # Keep other credentials (these weren't exposed)
   JWT_SECRET=
   REFRESH_JWT_SECRET=
   EMAIL_USER=vinay.qss@gmail.com
   EMAIL_PASS=jaznhofvilfzdukl
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ALLOWED_ORIGINS=
   NODE_ENV=development
   NEXT_PUBLIC_RAZORPAY_KEY_ID=
   RAZORPAY_KEY_SECRET=
   ```

### Step 4: Update Vercel Environment Variables

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Update Environment Variables**:
   - Go to Settings → Environment Variables
   - **DELETE** old MongoDB URI
   - **DELETE** old reCAPTCHA keys
   - **ADD** new MongoDB URI
   - **ADD** new reCAPTCHA keys

3. **Redeploy**:
   - Go to Deployments
   - Click "Redeploy" on latest deployment

### Step 5: Clean Git History (Optional but Recommended)

**Warning**: This will rewrite history and force push!

```bash
# Install BFG Repo Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror git@github.com:vinayprasad04/Umbrella-Stock.git

# Remove .env files from all commits
java -jar bfg.jar --delete-files .env.local Umbrella-Stock.git
java -jar bfg.jar --delete-files .env Umbrella-Stock.git

# Clean up
cd Umbrella-Stock.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: This rewrites history!)
git push --force
```

**Alternative (Simpler but Less Secure)**:
Just rotate all credentials and move forward. The old credentials will remain in Git history but will be invalid.

### Step 6: Verify .gitignore

Ensure `.env` files are properly ignored:

```bash
# Check .gitignore
cat .gitignore | grep env

# Should see:
# .env*.local
# .env
```

**Already correct!** ✓

### Step 7: Test Everything

After rotating credentials:

1. **Test Local**:
   ```bash
   npm run dev
   ```
   - Try to login
   - Try to signup (tests reCAPTCHA)

2. **Test Production**:
   - Visit: https://stock.incomegrow.in
   - Try to login
   - Try to signup

## 📋 Checklist

- [ ] MongoDB password changed in Atlas
- [ ] New MongoDB URI updated in `.env.local`
- [ ] New MongoDB URI updated in Vercel
- [ ] Old reCAPTCHA site deleted
- [ ] New reCAPTCHA site created
- [ ] New reCAPTCHA keys updated in `.env.local`
- [ ] New reCAPTCHA keys updated in Vercel
- [ ] Vercel redeployed with new credentials
- [ ] Local testing successful
- [ ] Production testing successful
- [ ] Consider cleaning Git history (optional)

## 🛡️ Prevention Measures

### Already Implemented ✓
- `.env*.local` in `.gitignore`
- `.env` in `.gitignore`
- Separate `.env.example` for documentation

### Additional Recommendations

1. **Enable Branch Protection**:
   - Go to GitHub → Settings → Branches
   - Protect `main` branch
   - Require pull request reviews

2. **Add Pre-commit Hook**:
   ```bash
   npm install --save-dev husky
   npx husky init

   # Add to .husky/pre-commit:
   #!/bin/sh
   if git diff --cached --name-only | grep -E '\.env$|\.env\.local$'; then
     echo "❌ Error: Attempting to commit .env files!"
     exit 1
   fi
   ```

3. **Use GitHub Secret Scanning**:
   - Go to GitHub → Settings → Code security and analysis
   - Enable "Secret scanning"
   - Enable "Push protection"

4. **Monitor GitGuardian**:
   - Keep GitGuardian monitoring enabled
   - Act immediately on alerts

## 🔍 What Happened?

Likely scenarios:
1. `.env.local` was accidentally committed before being added to `.gitignore`
2. Someone did `git add .` which staged all files including `.env.local`
3. The commit was pushed before realizing the mistake

## 📞 Need Help?

If you see any suspicious activity:
- Check MongoDB Atlas logs for unusual access
- Check Vercel deployment logs
- Monitor application logs for failed auth attempts
- Consider filing a security incident report

## ⏰ Timeline

- **October 29, 2025, 12:07 UTC**: Secrets pushed to GitHub
- **October 29, 2025**: GitGuardian detected and alerted
- **ASAP**: Rotate all credentials

## 🎯 Priority

**CRITICAL**: MongoDB credentials give FULL access to your database!
- Can read all user data
- Can modify data
- Can delete entire database
- Can export all data

**HIGH**: reCAPTCHA keys allow:
- Bypass bot protection
- Submit spam forms

---

**Status**: ⚠️ ACTIVE INCIDENT - Credentials must be rotated immediately!
