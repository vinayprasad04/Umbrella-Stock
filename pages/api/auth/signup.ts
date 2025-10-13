import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/lib/emailService';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface SignupResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<SignupResponse>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();
    
    const { name, email, password, phone }: SignupRequest = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user with USER role by default
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: 'USER', // Default role for new signups
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      createdBy: 'self-registration'
    });

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-account?token=${emailVerificationToken}`;

    const emailHtml = generateAccountVerificationEmail(newUser.name, newUser.email, verificationUrl);
    await sendEmail({
      to: newUser.email,
      subject: 'Verify Your Account - Umbrella Stock',
      html: emailHtml,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      },
      message: 'Account created successfully! Please check your email to verify your account.'
    });
    
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}