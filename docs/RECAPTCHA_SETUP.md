# Google reCAPTCHA v3 Setup Guide

This application uses Google reCAPTCHA v3 to protect forms from spam and bot submissions.

## What is reCAPTCHA v3?

reCAPTCHA v3 is an invisible CAPTCHA that analyzes user behavior without requiring any user interaction. It provides a score (0.0 to 1.0) indicating the likelihood of the user being human.

## Forms Protected

- ✅ **Signup Form** - Prevents fake account creation
- ✅ **Login Form** - Prevents brute force attacks
- ✅ **Forgot Password Form** - Prevents email spam
- ✅ **Contact Us Form** - Prevents spam messages
- ✅ **Newsletter Subscribe Form** - Prevents spam subscriptions

## Environment Variables Required

### For Local Development (.env.local)

```bash
# Site Key (Public - used in frontend)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcdrvgrAAAAAMqME_dqZhxffCiFHbPZmKc754Am

# Secret Key (Private - used in backend)
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### For Production

You need to add these environment variables to your hosting platform (Vercel, Netlify, etc.):

1. **NEXT_PUBLIC_RECAPTCHA_SITE_KEY** - Your production site key
2. **RECAPTCHA_SECRET_KEY** - Your production secret key

## Getting Production Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click on "Create" or the "+" button
3. Fill in the form:
   - **Label**: Your App Name (e.g., "Umbrella Stock Production")
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: Add your production domain(s)
     - Example: `yourdomain.com`
     - Example: `www.yourdomain.com`
   - Accept the terms of service
4. Click **Submit**
5. Copy both keys:
   - **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret Key** → `RECAPTCHA_SECRET_KEY`

## Deployment Instructions

### Vercel

1. Go to your project settings on Vercel
2. Navigate to **Environment Variables**
3. Add the following variables:
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY = your_site_key
   RECAPTCHA_SECRET_KEY = your_secret_key
   ```
4. Redeploy your application

### Other Platforms (Netlify, Railway, etc.)

1. Find the Environment Variables section in your platform's settings
2. Add both keys as shown above
3. Redeploy

## Configuration

### Score Threshold

The minimum score is set to **0.5** by default in `lib/recaptcha.ts`.

You can adjust this based on your needs:
- **0.0-0.3**: Very likely a bot
- **0.3-0.5**: Suspicious
- **0.5-0.7**: Normal user
- **0.7-1.0**: Very likely human

To change the threshold, edit `lib/recaptcha.ts`:

```typescript
const minScore = 0.5; // Adjust this value
```

### Actions

Each form has a specific action identifier:
- `signup` - Signup form
- `login` - Login form
- `forgot_password` - Forgot password form
- `contact` - Contact form
- `subscribe` - Newsletter subscribe form

## Testing

### Development Testing

reCAPTCHA v3 works automatically in development. You can test by:

1. Submitting any protected form
2. Checking the network tab for the reCAPTCHA token
3. Verifying backend logs for verification results

### Production Testing

After deployment:

1. Test all forms to ensure they work
2. Monitor the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) for:
   - Request volume
   - Score distribution
   - Suspicious activity

## Troubleshooting

### "reCAPTCHA not loaded" Error

**Cause**: The reCAPTCHA script failed to load.

**Solutions**:
- Check if the site key is correct
- Verify the domain is registered in reCAPTCHA console
- Check browser console for errors
- Ensure no ad blockers are interfering

### "reCAPTCHA verification failed" Error

**Cause**: Backend verification failed.

**Solutions**:
- Verify the secret key is set correctly in environment variables
- Check server logs for detailed error messages
- Ensure the backend can reach Google's servers
- Verify there are no firewall rules blocking the request

### Low Score (False Positives)

**Cause**: Legitimate users getting flagged.

**Solutions**:
- Lower the minimum score threshold
- Check if users are on VPNs or unusual networks
- Review reCAPTCHA console for patterns

## Security Best Practices

1. ✅ **Never expose the secret key** - Keep it server-side only
2. ✅ **Use environment variables** - Don't hardcode keys
3. ✅ **Monitor the admin console** - Check for unusual patterns
4. ✅ **Rotate keys periodically** - Generate new keys every 6-12 months
5. ✅ **Use HTTPS in production** - reCAPTCHA requires secure connections

## Support

For issues or questions:
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA FAQ](https://developers.google.com/recaptcha/docs/faq)
- [Google reCAPTCHA Support](https://support.google.com/recaptcha)

## Current Keys (Development)

**Site Key**: `6LcdrvgrAAAAAMqME_dqZhxffCiFHbPZmKc754Am`
**Secret Key**: Set in `.env.local` (not tracked in git)

⚠️ **Note**: These are development keys. Get new keys for production!
