import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Verification token is required' });
    }

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      deletedAt: null  // Only active accounts
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid verification token',
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Check if token expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired. Please sign up again or request a new verification email.',
        expired: true,
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
    });
  } catch (error) {
    console.error('Account verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during verification. Please try again.',
    });
  }
}
