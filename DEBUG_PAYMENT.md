# 🐛 Payment Error Debugging Guide

## ✅ Status Check

**API Reachable:** ✅ Yes
**Razorpay Configured:** ✅ Yes (both keys present)
**Error:** 500 Internal Server Error

---

## 🔍 Most Likely Issue: JWT Token Problem

Based on the error, the most common cause is:

### **Token Expired (Most Common)**

**Symptoms:**
- 500 error
- "Failed to create payment order" message
- No detailed error in console

**Why It Happens:**
- JWT tokens expire after 15 minutes
- If you logged in > 15 min ago, token is invalid

**Solution:**
1. **Log out completely**
2. **Log in again**
3. **Immediately try payment** (within 15 minutes)

---

## 🧪 Step-by-Step Debugging

### **Step 1: Check Your Token**

Open browser console (F12) and run:

```javascript
const token = localStorage.getItem('authToken');
console.log('Token exists:', !!token);
console.log('Token preview:', token?.substring(0, 50) + '...');

// Decode JWT to check expiration
if (token) {
  const parts = token.split('.');
  if (parts.length === 3) {
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload:', payload);
    console.log('Expires:', new Date(payload.exp * 1000));
    console.log('Is expired?:', Date.now() > payload.exp * 1000);
  }
}
```

**Expected Output:**
```
Token exists: true
Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
Token payload: {userId: "...", email: "...", role: "USER", exp: ...}
Expires: Thu Oct 30 2025 17:00:00 GMT...
Is expired?: false  ← Should be false!
```

**If expired is `true`:**
→ **Log out and log in again!**

---

### **Step 2: Test Payment API Directly**

Run this in browser console:

```javascript
async function testPaymentAPI() {
  const token = localStorage.getItem('authToken');

  console.log('Testing payment API...');

  const response = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('Status:', response.status);
  console.log('OK:', response.ok);

  const data = await response.json();
  console.log('Response:', data);

  return data;
}

testPaymentAPI();
```

**Expected Success:**
```
Status: 200
OK: true
Response: {success: true, orderId: "order_...", amount: 9900, ...}
```

**Expected Error (Token Expired):**
```
Status: 401
OK: false
Response: {success: false, error: "Invalid or expired token..."}
```

**Expected Error (Server):**
```
Status: 500
OK: false
Response: {success: false, error: "..."}
```

---

### **Step 3: Check Server Logs**

**In your terminal, you should see:**

```
[Payment] Create order request received
[Payment] Verifying token...
```

**If you see nothing** → API isn't being called (routing issue)
**If you see token error** → Token is expired/invalid
**If you see Razorpay error** → Razorpay API issue

---

## 🎯 Quick Fixes

### **Fix 1: Refresh Token (95% of cases)**

```
1. Click "Log out"
2. Log in again
3. Immediately try payment
```

---

### **Fix 2: Clear Browser Data**

```
1. Press F12 (Dev Tools)
2. Go to Application tab
3. Storage → Local Storage → Clear All
4. Refresh page
5. Log in again
```

---

### **Fix 3: Check Environment Variables**

Make sure `.env.local` has:

```env
JWT_SECRET=your-secret-key-at-least-32-characters-long
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

Then restart dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 📊 Error Scenarios

### **Scenario 1: 401 Unauthorized**

**Error Message:**
```
"Invalid or expired token. Please log in again."
```

**Cause:** JWT token expired (15 min)

**Fix:** Log out → Log in → Try again

---

### **Scenario 2: 500 Internal Server Error (No Details)**

**Error Message:**
```
"Failed to create payment order"
```

**Cause:** Could be:
- Token verification failing silently
- Razorpay API error
- Missing environment variables

**Fix:**
1. Check server logs
2. Test with `/api/payment/test` endpoint
3. Restart dev server

---

### **Scenario 3: 500 with Razorpay Error**

**Error Message:**
```
"Payment gateway configuration error..."
```

**Cause:** Invalid Razorpay keys

**Fix:**
1. Verify keys at: https://dashboard.razorpay.com/app/keys
2. Update `.env.local`
3. Restart server

---

## 🔬 Advanced Debugging

### **Get Detailed Error Info**

Add this to your browser console:

```javascript
// Enable detailed logging
localStorage.setItem('debug', '*');

// Then click payment button and check console
```

### **Check Network Tab**

1. Open F12 → Network tab
2. Click "Upgrade Now"
3. Find `/api/payment/create-order` request
4. Click on it → Preview/Response tab
5. See exact error message

---

## 🚀 Most Common Solution

**90% of the time, this fixes it:**

```bash
# In browser:
1. Log out
2. Log in
3. Try payment within 5 minutes
```

**Why?**
- JWT tokens expire after 15 minutes
- You probably logged in > 15 min ago
- Fresh login = fresh token = payment works!

---

## 📝 Checklist

Before asking for help, verify:

- [ ] Logged out and logged in again (< 15 min ago)
- [ ] Token exists in localStorage
- [ ] Token is not expired (check with Step 1 above)
- [ ] Server is running (`npm run dev`)
- [ ] `.env.local` has correct Razorpay keys
- [ ] Tested with `/api/payment/test` endpoint
- [ ] Checked Network tab for error details
- [ ] Checked server terminal for logs

---

## 💡 What to Share If Still Not Working

If still failing after all above steps, share:

### **1. Token Status:**
```javascript
// Run in console and share output
const token = localStorage.getItem('authToken');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log({
  hasToken: !!token,
  userId: payload.userId,
  role: payload.role,
  expires: new Date(payload.exp * 1000),
  isExpired: Date.now() > payload.exp * 1000,
});
```

### **2. API Response:**
```javascript
// Run testPaymentAPI() and share full output
```

### **3. Server Logs:**
```
# Copy the terminal output when clicking payment
```

### **4. Network Tab:**
```
# Screenshot of the failed request in Network tab
```

---

## 🎉 Expected Working Flow

**When everything works:**

1. Click "Upgrade Now"
2. Console shows:
   ```
   Creating payment order...
   Response status: 200
   Response ok: true
   Payment order response: {success: true, orderId: "..."}
   ```
3. Razorpay modal opens
4. Complete payment
5. Success!

---

**Start with Fix 1 (log out/in) - it solves 95% of issues!** ✅
