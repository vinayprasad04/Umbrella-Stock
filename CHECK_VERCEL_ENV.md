# Verify and Fix NODE_ENV on Vercel

## 🔴 **Problem Confirmed**

Your production API is accepting requests WITHOUT Origin header, which means `NODE_ENV=production` is **NOT properly set** on Vercel.

**Test Result:**
```bash
curl https://umbrella-stock.vercel.app/api/auth/login
# Returns 200 OK - Should be 403 Forbidden!
```

---

## ✅ **Solution: Properly Set NODE_ENV on Vercel**

### **Step 1: Login to Vercel Dashboard**

Go to: https://vercel.com/dashboard

### **Step 2: Select Your Project**

Click on: **umbrella-stock**

### **Step 3: Go to Settings**

Click: **Settings** tab (at the top)

### **Step 4: Environment Variables**

Click: **Environment Variables** in the left sidebar

### **Step 5: Check if NODE_ENV Exists**

Look for `NODE_ENV` in the list.

**If it exists:**
- Click the **"..."** menu next to it
- Click **Edit**
- **IMPORTANT:** Check which environments it's assigned to
- Make sure **"Production"** checkbox is checked ✅
- Value should be: `production`
- Click **Save**

**If it doesn't exist:**
- Click **Add New** button
- Name: `NODE_ENV`
- Value: `production`
- **IMPORTANT:** Select environments
  - ✅ Check **Production**
  - You can optionally check Preview and Development too
- Click **Save**

### **Step 6: CRITICAL - Redeploy**

**This is the most important step!** Environment variable changes don't take effect until you redeploy.

#### **Option A: Via Dashboard**
1. Click **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu
4. Click **Redeploy**
5. Confirm the redeploy
6. **Wait for deployment to complete** (watch the progress)

#### **Option B: Via Git Push**
```bash
git commit --allow-empty -m "Trigger redeploy for NODE_ENV"
git push origin main
```

#### **Option C: Via Vercel CLI**
```bash
vercel --prod
```

### **Step 7: Wait for Deployment**

**DO NOT TEST** until you see "✓ Deployment ready" or "Completed" status!

This usually takes 1-2 minutes.

---

## 🧪 **Step 8: Test After Redeployment**

### **Test 1: WITHOUT Origin (Should FAIL Now)**

```bash
curl -X POST https://umbrella-stock.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"vinay.qss@gmail.com","password":"654321"}'
```

**Expected Response:** ❌ **403 Forbidden**
```json
{
  "success": false,
  "error": "Request origin not allowed"
}
```

### **Test 2: WITH Origin (Should WORK)**

```bash
curl -X POST https://umbrella-stock.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://umbrella-stock.vercel.app' \
  --data-raw '{"email":"vinay.qss@gmail.com","password":"654321"}'
```

**Expected Response:** ✅ **200 OK**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "...",
    ...
  }
}
```

### **Or Run the Test Script:**

```bash
./test-production-security.sh
```

**Expected Output:**
```
✅✅✅ ALL TESTS PASSED ✅✅✅

Your production security is working correctly!
- Blocks requests without Origin header
- Allows requests with valid Origin header
```

---

## 🔍 **Common Mistakes**

### ❌ **Mistake 1: Not Selecting "Production" Environment**

When adding `NODE_ENV`, you must check the **Production** checkbox!

Vercel has three environments:
- Production (your main deployment)
- Preview (pull request previews)
- Development (local development)

Make sure **Production** is selected!

### ❌ **Mistake 2: Not Redeploying**

Environment variables only take effect on **NEW deployments**!

You MUST redeploy after adding/changing environment variables.

### ❌ **Mistake 3: Testing Too Soon**

Wait for the deployment to complete before testing. Look for:
- ✓ Deployment completed
- ✓ Build successful
- ✓ No errors

---

## 📸 **Visual Guide**

### **What You Should See in Vercel:**

```
Environment Variables
┌─────────────────────────────────────────────────┐
│ NODE_ENV                                        │
│ Value: production                               │
│ Environments: ✅ Production ◯ Preview ◯ Dev     │
│ Created: [date]                                 │
└─────────────────────────────────────────────────┘
```

**CRITICAL:** The "Production" checkbox MUST be checked!

---

## 🆘 **If Still Not Working**

### **Check 1: Verify Environment Variable via API**

Create a test endpoint to check:

```bash
# Check if NODE_ENV is actually set
curl https://umbrella-stock.vercel.app/api/health
```

Create this file if needed: `pages/api/health.ts`
```typescript
export default function handler(req, res) {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
```

### **Check 2: View Deployment Logs**

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Click on the latest deployment
4. Check **Build Logs** for any errors
5. Check **Function Logs** for runtime errors

### **Check 3: Clear Vercel Cache**

Sometimes Vercel caches old deployments:

1. Go to **Settings** → **General**
2. Scroll to **Deployment Protection**
3. Toggle it off and on again
4. Redeploy

---

## 📋 **Verification Checklist**

After following all steps, verify:

- [ ] `NODE_ENV` exists in Vercel environment variables
- [ ] `NODE_ENV` value is `production` (lowercase)
- [ ] "Production" environment is checked ✅
- [ ] Deployment completed successfully
- [ ] Test without Origin returns 403 Forbidden
- [ ] Test with Origin returns 200 OK
- [ ] Browser login works normally
- [ ] Test script shows "ALL TESTS PASSED"

---

## 💡 **Why This Happens**

Vercel doesn't automatically set `NODE_ENV=production`.

Many developers assume it's set automatically, but it's not!

You must manually add it as an environment variable.

---

## 🎯 **Expected Timeline**

1. Add/verify `NODE_ENV` - 2 minutes
2. Trigger redeploy - 30 seconds
3. Wait for deployment - 1-2 minutes
4. Test security - 1 minute

**Total: ~5 minutes**

---

**After completing these steps, run:**
```bash
./test-production-security.sh
```

**You should see:**
```
✅✅✅ ALL TESTS PASSED ✅✅✅
```

Then your production API will be properly secured!
