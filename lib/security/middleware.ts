import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

/**
 * Rate Limiting Store (In-memory)
 * For production, use Redis or similar distributed cache
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, value] of entries) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newEntry);
      return newEntry;
    }

    entry.count++;
    this.store.set(key, entry);
    return entry;
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && Date.now() <= entry.resetTime) {
      return entry;
    }
    return undefined;
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  message?: string;  // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextApiRequest) => string;
}

/**
 * Rate Limiting Middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextApiRequest, res: NextApiResponse, next?: () => void): Promise<boolean> => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientIdentifier(req);
    const identifier = `ratelimit:${key}`;

    const { count, resetTime } = rateLimitStore.increment(identifier, config.windowMs);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

    if (count > config.max) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      res.status(429).json({
        success: false,
        error: config.message || 'Too many requests, please try again later.',
        retryAfter,
      });
      return false;
    }

    if (next) next();
    return true;
  };
}

/**
 * Predefined Rate Limit Configurations
 */
export const RateLimitPresets = {
  // Strict: For authentication endpoints (5 requests per 15 minutes)
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },

  // Auth: For login/signup (10 requests per 15 minutes)
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many requests. Please try again later.',
  },

  // Moderate: For forms (10 requests per hour)
  moderate: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many requests. Please try again in an hour.',
  },

  // Standard: For general API (100 requests per minute)
  standard: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Rate limit exceeded. Please slow down.',
  },

  // Public: For public data endpoints with API key (1000 requests per hour)
  publicWithKey: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
    message: 'API rate limit exceeded. Please check your subscription plan.',
  },

  // Public: For public data endpoints without API key (DISABLED - API key required)
  publicWithoutKey: {
    windowMs: 60 * 1000, // 1 minute
    max: 0, // No access without API key
    message: 'API key required. Please include X-API-Key header in your request.',
  },
};

/**
 * Get client identifier (IP address + User Agent hash)
 */
function getClientIdentifier(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';

  const userAgent = req.headers['user-agent'] || '';
  const hash = crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 8);

  return `${ip}:${hash}`;
}

/**
 * API Key Validation
 */
export function requireApiKey(req: NextApiRequest, res: NextApiResponse): boolean {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key required. Add X-API-Key header to your request.',
      hint: 'Get your API key at https://yourdomain.com/api-keys',
    });
    return false;
  }

  // Validate API key
  const validApiKey = process.env.PUBLIC_API_KEY;
  if (!validApiKey) {
    // If no API key is configured, allow requests but with lower rate limit
    return true;
  }

  if (apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: 'Invalid API key.',
    });
    return false;
  }

  return true;
}

/**
 * Optional API Key (higher rate limit if provided)
 */
export function optionalApiKey(req: NextApiRequest): boolean {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.PUBLIC_API_KEY;

  if (!apiKey || !validApiKey) {
    return false;
  }

  return apiKey === validApiKey;
}

/**
 * CORS Middleware
 */
export function corsMiddleware(req: NextApiRequest, res: NextApiResponse): boolean {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_BASE_URL || '',
  ];

  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all in development
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key,X-Internal-Secret');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // Don't continue processing
  }

  return true;
}

/**
 * Security Headers Middleware
 */
export function securityHeaders(res: NextApiResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Only set HSTS in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/**
 * Origin Validation for Sensitive Operations
 */
export function validateOrigin(req: NextApiRequest, res: NextApiResponse): boolean {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_BASE_URL || '',
  ];

  const origin = req.headers.origin || req.headers.referer || '';

  // In development, be more lenient
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check if origin matches allowed domains
  const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));

  if (!isAllowed) {
    res.status(403).json({
      success: false,
      error: 'Request origin not allowed',
    });
    return false;
  }

  return true;
}

/**
 * Internal Secret Validation (for CRON jobs and server-to-server)
 */
export function validateInternalSecret(req: NextApiRequest, res: NextApiResponse): boolean {
  const secret = req.headers['x-internal-secret'] as string;
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    console.error('⚠️  SECURITY WARNING: INTERNAL_API_SECRET not configured');
    res.status(500).json({
      success: false,
      error: 'Internal API not configured',
    });
    return false;
  }

  if (!secret || secret !== expectedSecret) {
    console.warn('⚠️  Unauthorized internal API access attempt from:', getClientIdentifier(req));
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
    return false;
  }

  return true;
}

/**
 * Combined Security Middleware for Public Endpoints
 * REQUIRES API KEY - No anonymous access allowed
 */
export async function publicEndpointSecurity(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  // Apply security headers
  securityHeaders(res);

  // Apply CORS
  if (!corsMiddleware(req, res)) {
    return false; // OPTIONS request handled
  }

  // REQUIRE API key (mandatory)
  if (!requireApiKey(req, res)) {
    return false;
  }

  // Apply rate limiting (with valid API key)
  const allowed = await rateLimit(RateLimitPresets.publicWithKey)(req, res);
  if (!allowed) {
    return false;
  }

  return true;
}

/**
 * Combined Security Middleware for Auth Endpoints
 */
export async function authEndpointSecurity(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  // Apply security headers
  securityHeaders(res);

  // Apply CORS
  if (!corsMiddleware(req, res)) {
    return false;
  }

  // Validate origin for sensitive auth operations
  if (!validateOrigin(req, res)) {
    return false;
  }

  // Apply strict rate limiting
  const allowed = await rateLimit(RateLimitPresets.strict)(req, res);
  if (!allowed) {
    return false;
  }

  return true;
}

/**
 * Combined Security Middleware for Form Endpoints
 */
export async function formEndpointSecurity(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  // Apply security headers
  securityHeaders(res);

  // Apply CORS
  if (!corsMiddleware(req, res)) {
    return false;
  }

  // Validate origin
  if (!validateOrigin(req, res)) {
    return false;
  }

  // Apply moderate rate limiting
  const allowed = await rateLimit(RateLimitPresets.moderate)(req, res);
  if (!allowed) {
    return false;
  }

  return true;
}

/**
 * Logging Security Events
 */
export function logSecurityEvent(event: string, details: any, req: NextApiRequest): void {
  const timestamp = new Date().toISOString();
  const client = getClientIdentifier(req);

  console.warn(`[SECURITY] ${timestamp} - ${event}`, {
    client,
    method: req.method,
    url: req.url,
    ...details,
  });
}
