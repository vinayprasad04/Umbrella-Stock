# Testing Security: Development vs Production

## 🔍 **Understanding What You're Testing**

You copied a curl command from your browser's Network tab, but it's calling **localhost**, not production!

```bash
curl 'http://localhost:3000/api/auth/login'  # ← This is LOCAL DEV, not production!
```

---

## 📊 **Development vs Production**

| Aspect | Local Development | Vercel Production |
|--------|------------------|-------------------|
| **URL** | `http://localhost:3000` | `https://umbrella-stock.vercel.app` |
| **NODE_ENV** | `development` | `production` |
| **Origin Validation** | ❌ Bypassed (for testing) | ✅ Enforced (security) |
| **Postman Access** | ✅ Always works | ❌ Blocked without Origin |
| **Rate Limiting** | ✅ Active (5/15min) | ✅ Active (5/15min) |

---

## ✅ **How to Test Production Security**

### **Test 1: Production WITHOUT Origin Header**

**Command:**
```bash
curl -X POST https://umbrella-stock.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"vinay.qss@gmail.com","password":"your-password"}'
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "Request origin not allowed"
}
```

✅ **If you get this error, your production security is working!**

---

### **Test 2: Production WITH Origin Header**

**Command:**
```bash
curl -X POST https://umbrella-stock.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://umbrella-stock.vercel.app' \
  --data-raw '{"email":"vinay.qss@gmail.com","password":"your-password"}'
```

**Expected Response (200 OK if credentials correct):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "vinay.qss@gmail.com",
      "name": "...",
      "role": "ADMIN"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

✅ **If login succeeds with Origin header, security is working correctly!**

---

### **Test 3: From Browser (Should Always Work)**

Open: https://umbrella-stock.vercel.app/login

Try logging in - should work because browser automatically includes correct Origin header.

---

## 🧪 **Testing in Postman**

### **Scenario A: Testing Production (Strict Security)**

1. **URL:** `https://umbrella-stock.vercel.app/api/auth/login`
2. **Method:** `POST`
3. **Headers:** `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "email": "vinay.qss@gmail.com",
     "password": "your-password"
   }
   ```
5. **Send** - Should get **403 Forbidden** ✅

6. **Add Origin header:**
   ```
   Origin: https://umbrella-stock.vercel.app
   ```
7. **Send** - Should get **200 OK** ✅

---

### **Scenario B: Testing Local Dev (Relaxed for Testing)**

1. **URL:** `http://localhost:3000/api/auth/login`
2. **Method:** `POST`
3. **Headers:** `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "email": "vinay.qss@gmail.com",
     "password": "your-password"
   }
   ```
5. **Send** - Should get **200 OK** (no Origin needed) ✅

This is **expected behavior** - local dev should be easier to test!

---

## 🔐 **Important: Password Issue**

The password `654321` won't work anymore because we removed the hard-coded admin bypass.

### **Solution: Update Admin Password in MongoDB**

Run this command to generate the hashed password:
```bash
node scripts/create-admin.js
```

**Output:**
```
Hashed Password: $2b$12$qD6gqdZ5qE7oEIuK506/e.vGC/Ch44SmvM2m/J616kGmS/D76sjO6
```

**Then update in MongoDB:**

#### Option A: MongoDB Compass (GUI)
1. Connect to your MongoDB
2. Go to database: `umbrella-stock`
3. Go to collection: `users`
4. Find user: `vinay.qss@gmail.com`
5. Edit document
6. Update `password` field with the hashed password above
7. Ensure `isEmailVerified: true` and `role: "ADMIN"`
8. Save

#### Option B: MongoDB Shell
```javascript
db.users.updateOne(
  { email: "vinay.qss@gmail.com" },
  {
    $set: {
      password: "$2b$12$qD6gqdZ5qE7oEIuK506/e.vGC/Ch44SmvM2m/J616kGmS/D76sjO6",
      isEmailVerified: true,
      role: "ADMIN",
      permissions: []
    }
  }
)
```

#### Option C: mongosh Command Line
```bash
mongosh "your-mongodb-connection-string" --eval 'db.users.updateOne({email:"vinay.qss@gmail.com"},{$set:{password:"$2b$12$qD6gqdZ5qE7oEIuK506/e.vGC/Ch44SmvM2m/J616kGmS/D76sjO6",isEmailVerified:true,role:"ADMIN"}})'
```

---

## 📋 **Complete Test Checklist**

### ✅ **Local Development (localhost:3000)**
- [ ] Login without Origin header → Should work (✅ Expected)
- [ ] Rate limiting after 5 attempts → Should work (✅ Expected)
- [ ] Security headers present → Should work (✅ Expected)

### ✅ **Production (umbrella-stock.vercel.app)**
- [ ] Login without Origin header → Should fail 403 (✅ Expected)
- [ ] Login with Origin header → Should work (✅ Expected)
- [ ] Website login from browser → Should work (✅ Expected)
- [ ] Rate limiting after 5 attempts → Should work (✅ Expected)
- [ ] Security headers present → Should work (✅ Expected)

---

## 🎯 **Expected Results Summary**

| Test | Local Dev | Production | Why Different? |
|------|-----------|-----------|---------------|
| Postman (no Origin) | ✅ Works | ❌ Blocked | Dev bypasses origin check |
| Postman (with Origin) | ✅ Works | ✅ Works | Origin validation passes |
| Browser login | ✅ Works | ✅ Works | Browser auto-sends Origin |
| curl (no Origin) | ✅ Works | ❌ Blocked | Dev bypasses origin check |
| Rate limit (5 attempts) | ✅ Active | ✅ Active | Same in both |

---

## 🔍 **How to Check Which Environment**

### **Check URL:**
- `http://localhost:3000` → Local Dev
- `https://umbrella-stock.vercel.app` → Production

### **Check Response Headers:**
```bash
curl -I https://umbrella-stock.vercel.app/api/auth/login
```

Look for `x-vercel-id` header → Confirms it's Vercel

---

## 🚀 **Quick Testing Commands**

### **Test Production Security:**
```bash
# Should fail (403)
curl -X POST https://umbrella-stock.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"vinay.qss@gmail.com","password":"654321"}'

# Should work (200)
curl -X POST https://umbrella-stock.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://umbrella-stock.vercel.app' \
  -d '{"email":"vinay.qss@gmail.com","password":"654321"}'
```

### **Test Rate Limiting:**
```bash
# Run 6 times - should block on 6th attempt
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://umbrella-stock.vercel.app/api/auth/login \
    -H 'Content-Type: application/json' \
    -H 'Origin: https://umbrella-stock.vercel.app' \
    -d '{"email":"test@test.com","password":"wrong"}' \
    2>/dev/null
  echo -e "\n---"
done
```

---

## ⚠️ **Common Mistakes**

### ❌ **Mistake 1: Testing localhost instead of production**
```bash
# WRONG - This is local dev, not production
curl http://localhost:3000/api/auth/login
```
```bash
# CORRECT - This is production
curl https://umbrella-stock.vercel.app/api/auth/login
```

### ❌ **Mistake 2: Expecting localhost to block without Origin**
**Local dev SHOULD work without Origin** - this is by design for testing!

### ❌ **Mistake 3: Using old hard-coded password**
The password `654321` needs to be hashed in MongoDB first. Use `scripts/create-admin.js` to generate the hash.

---

## ✅ **Success Criteria**

Your security is working correctly when:

1. ✅ **Production blocks** Postman without Origin (403)
2. ✅ **Production allows** Postman with Origin (200)
3. ✅ **Production allows** browser login (200)
4. ✅ **Rate limiting works** after 5 attempts (429)
5. ✅ **Local dev works** without restrictions (for testing)

---

**Next Steps:**
1. Update admin password in MongoDB using `scripts/create-admin.js`
2. Test production URL (not localhost)
3. Verify 403 without Origin header
4. Verify 200 with Origin header
5. Check off the test checklist above

**Remember:** Local dev (localhost) is supposed to be easier to test! Only production enforces strict origin validation.
