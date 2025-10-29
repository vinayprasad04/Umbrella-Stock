/**
 * Verify Google reCAPTCHA v3 token
 * @param token The reCAPTCHA token from the client
 * @param action The action name (e.g., 'login', 'signup', 'contact')
 * @returns {Promise<{success: boolean, score?: number, error?: string}>}
 */
export async function verifyRecaptcha(token: string, action?: string): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('⚠️ RECAPTCHA_SECRET_KEY is not configured in environment variables');
    return {
      success: false,
      error: 'reCAPTCHA is not properly configured'
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'No reCAPTCHA token provided'
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: 'reCAPTCHA verification failed'
      };
    }

    // Check action if provided
    if (action && data.action !== action) {
      return {
        success: false,
        error: 'reCAPTCHA action mismatch'
      };
    }

    // reCAPTCHA v3 returns a score between 0.0 and 1.0
    // 0.0 is very likely a bot, 1.0 is very likely a human
    // You can adjust this threshold based on your needs
    const minScore = 0.5;
    if (data.score < minScore) {
      return {
        success: false,
        score: data.score,
        error: `reCAPTCHA score too low: ${data.score}`
      };
    }

    return {
      success: true,
      score: data.score
    };
  } catch (error: any) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      error: 'reCAPTCHA verification failed: ' + error.message
    };
  }
}
