import { NextApiRequest, NextApiResponse } from 'next';
import {
  publicEndpointSecurity,
  authEndpointSecurity,
  formEndpointSecurity,
  validateInternalSecret,
  securityHeaders,
  corsMiddleware,
} from './middleware';

/**
 * Wrapper for public API endpoints with anti-scraping protection
 * Usage:
 * export default withPublicSecurity(async (req, res) => {
 *   // Your endpoint logic
 * });
 */
export function withPublicSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowed = await publicEndpointSecurity(req, res);
    if (!allowed) return;

    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Wrapper for authentication endpoints (login, signup, password reset)
 * Usage:
 * export default withAuthSecurity(async (req, res) => {
 *   // Your auth logic
 * });
 */
export function withAuthSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowed = await authEndpointSecurity(req, res);
    if (!allowed) return;

    try {
      await handler(req, res);
    } catch (error) {
      console.error('Auth API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Wrapper for form submission endpoints (contact, subscribe)
 * Usage:
 * export default withFormSecurity(async (req, res) => {
 *   // Your form logic
 * });
 */
export function withFormSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowed = await formEndpointSecurity(req, res);
    if (!allowed) return;

    try {
      await handler(req, res);
    } catch (error) {
      console.error('Form API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Wrapper for internal/CRON endpoints
 * Usage:
 * export default withInternalSecurity(async (req, res) => {
 *   // Your cron logic
 * });
 */
export function withInternalSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Apply basic security headers
    securityHeaders(res);

    // Validate internal secret
    if (!validateInternalSecret(req, res)) return;

    try {
      await handler(req, res);
    } catch (error) {
      console.error('Internal API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Wrapper for basic security (CORS + Headers only)
 * Usage:
 * export default withBasicSecurity(async (req, res) => {
 *   // Your logic
 * });
 */
export function withBasicSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    securityHeaders(res);

    if (!corsMiddleware(req, res)) {
      return; // OPTIONS handled
    }

    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Generate secure API key
 */
export function generateApiKey(): string {
  const crypto = require('crypto');
  return `usk_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Generate secure internal secret
 */
export function generateInternalSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Generate JWT secret
 */
export function generateJWTSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
}
