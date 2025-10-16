import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { AuthUtils } from '@/lib/auth';
import { sendEmail } from '@/lib/emailService';
import crypto from 'crypto';

function generateAccountVerificationEmail(name: string, email: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Umbrella Stock</h1>
                  <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Welcome aboard, ${name}!</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
                  <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Thank you for creating an account with Umbrella Stock! To complete your registration and start accessing all features, please verify your email address.
                  </p>
                  <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Click the button below to verify your account:
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 6px; padding: 16px 40px;">
                        <a href="${verificationUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                          Verify My Account
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    If you didn't create this account, you can safely ignore this email.
                  </p>
                  <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                  </p>
                  <p style="margin: 30px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    This verification link will expire in 24 hours.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} Umbrella Stock. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    This email was sent to ${email}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify authentication and admin role
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decodedToken = AuthUtils.verifyAccessToken(token);
    if (!decodedToken || !['ADMIN', 'DATA_ENTRY'].includes(decodedToken.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await connectDB();

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, error: 'Email is already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-account?token=${emailVerificationToken}`;

    const emailHtml = generateAccountVerificationEmail(user.name, user.email, verificationUrl);
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Verify Your Account - Umbrella Stock',
      html: emailHtml,
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send verification email'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Verification email sent successfully to ${user.email}`,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
