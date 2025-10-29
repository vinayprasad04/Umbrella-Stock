# Razorpay Payment Gateway Setup Guide

This guide will help you set up Razorpay payment gateway for the Umbrella Stock premium subscription.

## Prerequisites

- PAN card (mandatory for all Indian payment gateways)
- Valid business/individual bank account
- GST registration (recommended but optional for small businesses)

## Step 1: Create Razorpay Account

1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete your profile with:
   - Business name
   - Contact details
   - Business type

## Step 2: Complete KYC Verification

1. Go to Account Settings → KYC
2. Submit the following documents:
   - **PAN Card** (mandatory)
   - **Business proof** (for business accounts):
     - GST certificate, or
     - Shop establishment certificate, or
     - Business registration certificate
   - **Bank account details**:
     - Account number
     - IFSC code
     - Cancelled cheque or bank statement

3. Wait for verification (typically 24-48 hours)

## Step 3: Get API Keys

### Test Mode (for development)

1. In Razorpay Dashboard, click on "Test Mode" toggle
2. Go to Settings → API Keys
3. Click "Generate Test Key"
4. Copy both:
   - Key ID (starts with `rzp_test_`)
   - Key Secret

### Live Mode (for production)

1. Complete KYC verification first
2. Toggle to "Live Mode"
3. Go to Settings → API Keys
4. Click "Generate Live Key"
5. Copy both:
   - Key ID (starts with `rzp_live_`)
   - Key Secret

## Step 4: Configure Environment Variables

### Local Development (.env.local)

```bash
# Razorpay Test Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_test_key_secret_here
```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```bash
# Razorpay Live Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id_here
RAZORPAY_KEY_SECRET=your_live_key_secret_here
```

**Important:** Keep your Key Secret secure! Never commit it to version control or expose it in client-side code.

## Step 5: Configure Payment Methods

1. In Razorpay Dashboard, go to Settings → Payment Methods
2. Enable **UPI** payment method
3. You can optionally enable:
   - Cards (Debit/Credit)
   - Net Banking
   - Wallets
   - EMI

**Current Setup:** We're using UPI-only payments for simplicity.

## Step 6: Test the Integration

### Test UPI Details

Razorpay provides test UPI IDs for testing:

- **Success:** `success@razorpay`
- **Failure:** `failure@razorpay`

### Testing Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/pricing` page
3. Click "Upgrade to Premium" on the Premium plan
4. Use test UPI ID: `success@razorpay`
5. Verify payment success page appears
6. Check database - user subscription should be updated

### Test Failed Payment

1. Click "Upgrade to Premium"
2. Use test UPI ID: `failure@razorpay`
3. Verify payment failure page appears

## Step 7: Webhook Setup (Optional but Recommended)

Webhooks notify your server about payment events automatically.

1. In Razorpay Dashboard, go to Settings → Webhooks
2. Click "Create Webhook"
3. Enter webhook URL: `https://your-domain.com/api/payment/webhook`
4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Copy the Webhook Secret
6. Add to environment variables:
   ```bash
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

## Step 8: Go Live

### Pre-launch Checklist

- [ ] KYC verification completed
- [ ] Live API keys generated
- [ ] Environment variables updated on production
- [ ] Test payment flow in test mode
- [ ] Verify success/failure pages work correctly
- [ ] Check database updates on successful payment
- [ ] Test webhook (if configured)

### Launch Steps

1. Update environment variables to use live keys
2. Deploy to production
3. Make a real test payment (₹1) to verify everything works
4. Refund the test payment from Razorpay Dashboard
5. Monitor first few transactions closely

## Payment Flow

```
User clicks "Upgrade to Premium"
           ↓
  Check if user is logged in
           ↓
  Create Razorpay order via API
           ↓
  Open Razorpay checkout modal
           ↓
    User completes UPI payment
           ↓
  Razorpay sends payment response
           ↓
 Verify payment signature via API
           ↓
    Update user subscription
           ↓
  Redirect to success page
```

## API Endpoints

### 1. Create Order
- **Endpoint:** `POST /api/payment/create-order`
- **Auth:** Required (Bearer token)
- **Response:** Order ID, amount, currency, Razorpay key

### 2. Verify Payment
- **Endpoint:** `POST /api/payment/verify`
- **Auth:** Required (Bearer token)
- **Body:**
  ```json
  {
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx"
  }
  ```
- **Action:** Verifies payment signature and upgrades user to premium

## Pricing Configuration

Current setup:
- **Plan:** Premium Annual
- **Amount:** ₹99 (special offer - original ₹999)
- **Validity:** 1 year
- **Features:** Save up to 10 scanner queries + more

To change pricing:
1. Update amount in `/api/payment/create-order.ts`
2. Update UI in `/app/pricing/page.tsx`

## Security Best Practices

1. **Never expose Key Secret** in client-side code
2. **Always verify payment signature** on server-side
3. **Use HTTPS** in production
4. **Store webhook secret** securely
5. **Log all payment attempts** for debugging
6. **Implement rate limiting** on payment endpoints
7. **Validate user authentication** before creating orders

## Troubleshooting

### Payment Modal Not Opening
- Check if Razorpay script is loaded: `window.Razorpay`
- Verify Key ID in environment variables
- Check browser console for errors

### Payment Verification Failed
- Verify Key Secret is correct
- Check payment signature calculation
- Ensure webhook secret matches (if using webhooks)

### User Subscription Not Updated
- Check API response in browser network tab
- Verify MongoDB connection
- Check server logs for errors
- Ensure user authentication is valid

### Test Payments Not Working
- Confirm you're using test mode keys (rzp_test_)
- Use Razorpay's test UPI IDs
- Check if test mode is enabled in dashboard

## Support

- **Razorpay Docs:** https://razorpay.com/docs/
- **Dashboard:** https://dashboard.razorpay.com/
- **Support:** support@razorpay.com
- **API Status:** https://status.razorpay.com/

## Refund Policy

To issue refunds:

1. Go to Razorpay Dashboard → Payments
2. Find the payment to refund
3. Click "Refund"
4. Select full or partial refund
5. Add refund note (optional)
6. Confirm refund

Refunds are processed instantly for UPI payments.

## Next Steps

1. Get your Razorpay account and API keys
2. Update `.env.local` with your test keys
3. Test the payment flow locally
4. Complete KYC verification
5. Get live API keys
6. Update production environment variables
7. Deploy and go live!
