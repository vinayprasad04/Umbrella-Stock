# Razorpay Payment Integration - IncomeGrow Stock

## ✅ Integration Status: COMPLETE

Razorpay payment gateway has been successfully integrated with test credentials.

## 🔑 Current Configuration

### Test Mode Credentials (Development)
- **Key ID**: `rzp_test_RZHVAvi9JJX7V0`
- **Key Secret**: `G5lkQCfiJRspamKauWeWwEHu`
- **Environment**: TEST MODE

### Production Credentials (For Deployment)
When deploying to production (Vercel), update these in Vercel environment variables:
- **NEXT_PUBLIC_RAZORPAY_KEY_ID**: Your live key (starts with `rzp_live_`)
- **RAZORPAY_KEY_SECRET**: Your live secret key

## 💰 Pricing Plan

### Premium Annual Plan
- **Price**: ₹99/year
- **Original Price**: ₹999/year (90% OFF)
- **Features**:
  - Save up to 10 scanner queries (vs 2 in Free)
  - Advanced analytics & insights
  - Priority email support
  - Export reports (PDF, Excel)
  - Custom alerts & notifications
  - Historical data access
  - API access (coming soon)
  - Ad-free experience
  - Early access to new features

## 🔗 Integration URLs

| Page/API | URL | Purpose |
|----------|-----|---------|
| Pricing Page | `/pricing` | Display plans and initiate payment |
| Create Order API | `/api/payment/create-order` | Create Razorpay order |
| Verify Payment API | `/api/payment/verify` | Verify payment signature |
| Success Page | `/payment/success` | Payment success confirmation |
| Failure Page | `/payment/failure` | Payment failure handling |

## 🧪 Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Payment Flow
1. Navigate to: `http://localhost:3000/pricing`
2. Sign up or login
3. Click **"Upgrade to Premium"** button
4. Razorpay checkout will open

### 3. Test Payment Methods

#### Test Cards (Success)
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **OTP** (for 3DS): `123456`

#### Test UPI
- **UPI ID**: `success@razorpay`
- This will simulate a successful payment

#### Test Failure Scenarios
- **Card Number**: `4000 0000 0000 0002`
- This will simulate a failed payment

### 4. Verify Payment
After successful payment:
- User is redirected to `/payment/success`
- User subscription is upgraded to **Premium**
- Subscription data is stored in MongoDB
- Scanner query limit increases from 2 to 10

## 📝 Implementation Details

### Payment Flow
```
1. User clicks "Upgrade to Premium"
   ↓
2. Frontend calls /api/payment/create-order
   ↓
3. Razorpay order is created (₹99)
   ↓
4. Razorpay checkout modal opens
   ↓
5. User completes payment
   ↓
6. Frontend calls /api/payment/verify
   ↓
7. Backend verifies signature using HMAC SHA256
   ↓
8. User subscription updated in MongoDB
   ↓
9. Redirect to /payment/success
```

### Security Features
✅ Payment signature verification using HMAC SHA256
✅ Authentication required for payment APIs
✅ Server-side order creation
✅ Secure key storage in environment variables
✅ Test mode for development, live mode for production

## 🚀 Deployment to Vercel

### Environment Variables to Set
```bash
# Razorpay (Use LIVE credentials for production)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET

# Other required variables
MONGODB_CONNECTION_URI=mongodb+srv://...
JWT_SECRET=incomegrow-stock-jwt-secret-key-2024-admin-auth
REFRESH_JWT_SECRET=incomegrow-stock-refresh-jwt-secret-key-2024-admin-auth
NEXT_PUBLIC_BASE_URL=https://stock.incomegrow.in
EMAIL_USER=vinay.qss@gmail.com
EMAIL_PASS=jaznhofvilfzdukl
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcdrvgrAAAAAMqME_dqZhxffCiFHbPZmKc754Am
RECAPTCHA_SECRET_KEY=6LcdrvgrAAAAAIr9mjU6EuNxxjsynLILtqSSJ3l4
```

## 📊 Razorpay Dashboard

Access your Razorpay dashboard to:
- View all transactions
- Download reports
- Manage settlements
- View test payments

**Dashboard URL**: https://dashboard.razorpay.com/app/dashboard

## 🔧 Troubleshooting

### Payment Creation Fails
- **Error**: "Razorpay is not configured"
- **Solution**: Check `.env.local` has correct `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### Payment Verification Fails
- **Error**: "Invalid payment signature"
- **Solution**: Ensure `RAZORPAY_KEY_SECRET` matches the key used to create the order

### User Not Authenticated
- **Error**: "Authentication required"
- **Solution**: User must be logged in before making payment

## 📚 Additional Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Test Credentials**: https://razorpay.com/docs/payments/payments/test-card-details/
- **API Reference**: https://razorpay.com/docs/api/

## 🎉 Success!

Your Razorpay integration is complete and ready for testing!

To go live:
1. Get your **live API keys** from Razorpay dashboard
2. Update environment variables in Vercel
3. Test with small real transactions
4. Enable in production

---

**Note**: Always use test credentials in development and live credentials only in production.
