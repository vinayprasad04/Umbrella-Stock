import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import crypto from 'crypto';
import { sendEmail } from '@/lib/emailService';

interface ForgotPasswordRequest {
  email: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();
    
    const { email }: ForgotPasswordRequest = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });
    
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, we have sent password reset instructions.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (1 hour)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Get the base URL from the request headers (works for both localhost and domain)
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    console.log(`🔐 Password reset token for ${email}: ${resetToken}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);

    // Generate password reset email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #FF6B2C 0%, #FF8A50 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Umbrella Stock</h1>
                    <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Password Reset Request</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Reset Your Password</h2>

                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                      We received a request to reset your password. Click the button below to create a new password:
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #FF6B2C 0%, #FF8A50 100%); border-radius: 6px; padding: 16px 40px;">
                          <a href="${resetUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      This link will expire in 1 hour for security reasons.
                    </p>

                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${resetUrl}" style="color: #FF6B2C; word-break: break-all;">${resetUrl}</a>
                    </p>

                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #dc2626; font-size: 14px; line-height: 1.5;">
                        <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
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

    // Send password reset email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Your Password - Umbrella Stock',
      html: emailHtml,
      text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`
    });

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      // Don't reveal if email exists, but log the error
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, we have sent password reset instructions.',
      // In development, include the token and URL for testing
      ...(process.env.NODE_ENV === 'development' && {
        resetToken: resetToken,
        resetUrl: resetUrl,
        emailSent: emailResult.success
      })
    });
    
  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
}