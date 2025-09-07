import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import crypto from 'crypto';

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

    // In a real application, you would send an email here
    // For demo purposes, we'll just log the reset token
    console.log(`🔐 Password reset token for ${email}: ${resetToken}`);
    console.log(`🔗 Reset URL would be: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && {
        resetToken: resetToken,
        resetUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`
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