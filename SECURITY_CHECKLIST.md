# Security Implementation Checklist

## Phase 1: Critical Security Fixes ✅ COMPLETED

- [x] Remove hard-coded admin credentials from login
- [x] Add JWT secret validation with production checks
- [x] Create security middleware (rate limiting, CORS, headers)
- [x] Protect CRON endpoints with internal secret
- [x] Update environment files with security variables

## Phase 2: Apply Security to Endpoints (IN PROGRESS)

### Authentication Endpoints - HIGH PRIORITY
- [x] `/api/auth/login` - **DONE** (withAuthSecurity)
- [ ] `/api/auth/signup` - Add withAuthSecurity
- [ ] `/api/auth/refresh` - Add withAuthSecurity
- [ ] `/api/auth/forgot-password` - Add withAuthSecurity
- [ ] `/api/auth/reset-password` - Add withAuthSecurity
- [ ] `/api/auth/verify-account` - Add withFormSecurity

### CRON/Internal Endpoints - HIGH PRIORITY
- [x] `/api/cron/init` - **DONE** (withInternalSecurity)
- [ ] `/api/debug/watchlist-order` - Add withInternalSecurity or remove

### Form Endpoints - MEDIUM PRIORITY
- [ ] `/api/subscribe` - Add withFormSecurity
- [ ] `/api/contact` - Add withFormSecurity
- [ ] `/api/unsubscribe` - Add withFormSecurity

### Public Data Endpoints - MEDIUM PRIORITY (Anti-Scraping)
- [x] `/api/stocks/top-gainers` - **DONE** (withPublicSecurity)
- [ ] `/api/stocks/top-losers` - Add withPublicSecurity
- [ ] `/api/stocks/top-50` - Add withPublicSecurity
- [ ] `/api/stocks/details/[symbol]` - Add withPublicSecurity
- [ ] `/api/stocks/chart/[symbol]` - Add withPublicSecurity
- [ ] `/api/stocks/live/[symbol]` - Add withPublicSecurity
- [ ] `/api/stocks/activities/latest` - Add withPublicSecurity
- [ ] `/api/stocks/verified/**` - Add withPublicSecurity
- [ ] `/api/search` - Add withPublicSecurity
- [ ] `/api/mutual-funds/**` - Add withPublicSecurity
- [ ] `/api/etfs` - Add withPublicSecurity
- [ ] `/api/equity/search` - Add withPublicSecurity
- [ ] `/api/indices/live` - Add withPublicSecurity
- [ ] `/api/sectors` - Add withPublicSecurity
- [ ] `/api/scanner/stocks` - Add withPublicSecurity

### Admin Endpoints - LOW PRIORITY (Already have JWT auth)
Note: These already have authentication but can benefit from additional security headers

- [ ] `/api/admin/**` - Consider adding withBasicSecurity for headers

### User Endpoints - LOW PRIORITY (Already have JWT auth)
Note: These already have authentication

- [ ] `/api/user/**` - Consider adding withBasicSecurity for headers

## Phase 3: Environment Configuration

### Local Development (.env.local)
- [ ] Generate and add JWT_SECRET
- [ ] Generate and add REFRESH_JWT_SECRET
- [ ] Generate and add INTERNAL_API_SECRET
- [ ] Generate and add PUBLIC_API_KEY (optional)
- [ ] Set ALLOWED_ORIGINS (localhost URLs)
- [ ] Set NODE_ENV=development

### Production (Vercel)
- [ ] Add JWT_SECRET to Vercel environment
- [ ] Add REFRESH_JWT_SECRET to Vercel environment
- [ ] Add INTERNAL_API_SECRET to Vercel environment
- [ ] Add PUBLIC_API_KEY to Vercel environment
- [ ] Add ALLOWED_ORIGINS with production domain
- [ ] Set NODE_ENV=production

## Phase 4: Testing

### Authentication Testing
- [ ] Test login rate limiting (try 6 requests in 15 min)
- [ ] Test signup rate limiting
- [ ] Test password reset rate limiting
- [ ] Verify JWT tokens are working
- [ ] Test token refresh mechanism

### Public API Testing
- [ ] Test rate limiting without API key (should hit 20/min limit)
- [ ] Test rate limiting with API key (should get 1000/hour)
- [ ] Verify rate limit headers are present
- [ ] Test CORS from different origins
- [ ] Check security headers in browser dev tools

### CRON Testing
- [ ] Test CRON endpoint without X-Internal-Secret (should fail)
- [ ] Test CRON endpoint with correct secret (should work)
- [ ] Test CRON endpoint with wrong secret (should fail)

### Form Testing
- [ ] Test contact form rate limiting (10/hour)
- [ ] Test subscribe rate limiting (10/hour)
- [ ] Verify origin validation works

## Phase 5: Monitoring & Logging

- [ ] Set up error logging for security events
- [ ] Monitor rate limit violations
- [ ] Track API key usage
- [ ] Set up alerts for suspicious activity
- [ ] Log all authentication failures

## Phase 6: Documentation

- [x] Create SECURITY_GUIDE.md - **DONE**
- [x] Create SECURITY_CHECKLIST.md - **DONE**
- [ ] Update README.md with security notes
- [ ] Update VERCEL_SETUP.md with security variables
- [ ] Document API key generation for users
- [ ] Create API documentation with rate limits

## Quick Commands

### Generate All Secrets at Once
```bash
node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('REFRESH_JWT_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('INTERNAL_API_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('PUBLIC_API_KEY=usk_' + crypto.randomBytes(32).toString('hex'));"
```

### Add to Vercel (One-by-one)
```bash
vercel env add JWT_SECRET production
vercel env add REFRESH_JWT_SECRET production
vercel env add INTERNAL_API_SECRET production
vercel env add PUBLIC_API_KEY production
vercel env add ALLOWED_ORIGINS production
vercel env add NODE_ENV production
```

### Test Rate Limiting
```bash
# Test without API key (should rate limit at 20/min)
for i in {1..25}; do curl https://your-domain.com/api/stocks/top-gainers; done

# Test with API key (higher limit)
for i in {1..25}; do curl -H "X-API-Key: usk_your_key" https://your-domain.com/api/stocks/top-gainers; done
```

### Test CRON Endpoint
```bash
# Should fail (no secret)
curl -X POST https://your-domain.com/api/cron/init

# Should work (with secret)
curl -X POST https://your-domain.com/api/cron/init \
  -H "X-Internal-Secret: your_internal_api_secret"
```

## Priority Order

1. **URGENT** (Do Today):
   - [x] Fix hard-coded admin credentials
   - [x] Add JWT secret validation
   - [x] Protect CRON endpoints
   - [ ] Generate and add production secrets to Vercel

2. **HIGH** (This Week):
   - [ ] Apply withAuthSecurity to all auth endpoints
   - [ ] Apply withPublicSecurity to top 10 most-used public endpoints
   - [ ] Apply withFormSecurity to contact/subscribe
   - [ ] Test rate limiting

3. **MEDIUM** (Next Week):
   - [ ] Apply withPublicSecurity to remaining public endpoints
   - [ ] Set up monitoring and logging
   - [ ] Update documentation

4. **LOW** (This Month):
   - [ ] Add withBasicSecurity to admin/user endpoints
   - [ ] Conduct security audit
   - [ ] Penetration testing

## Notes

- Each endpoint updated should be tested immediately
- Keep track of which endpoints are critical vs nice-to-have
- Public data endpoints are the main target for scrapers
- Auth endpoints are the main target for brute force
- CRON endpoints should never be exposed without secrets

## Success Criteria

✅ Phase 1 is complete when:
- No hard-coded credentials exist
- JWT secrets validated on startup
- CRON endpoints protected
- Environment files updated

✅ Phase 2 is complete when:
- All auth endpoints have withAuthSecurity
- Top 20 public endpoints have withPublicSecurity
- All forms have withFormSecurity
- All CRON endpoints have withInternalSecurity

✅ Phase 3 is complete when:
- All secrets generated and stored securely
- Production environment configured
- Local environment configured

✅ Phase 4 is complete when:
- All rate limits tested and working
- CORS tested from multiple origins
- Security headers verified
- API keys working correctly

✅ Project is production-ready when:
- All phases completed
- Documentation updated
- Team trained on security features
- Monitoring in place
