import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/lib/models/Subscriber';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Verification token is required' });
    }

    // Find subscriber with matching token
    const subscriber = await Subscriber.findOne({ verificationToken: token });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        error: 'Invalid verification token',
      });
    }

    // Check if already verified
    if (subscriber.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Check if token expired
    if (subscriber.verificationTokenExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired. Please subscribe again.',
        expired: true,
      });
    }

    // Mark as verified
    subscriber.isVerified = true;
    subscriber.verifiedAt = new Date();
    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You are now subscribed to our updates.',
      data: {
        email: subscriber.email,
        verifiedAt: subscriber.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Verify email API error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while verifying your email. Please try again.',
    });
  }
}
