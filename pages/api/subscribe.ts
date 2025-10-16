import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import { sendEmail, generateVerificationEmail } from '@/lib/emailService';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email: normalizedEmail });

    if (existingSubscriber) {
      if (existingSubscriber.isVerified) {
        return res.status(400).json({
          success: false,
          error: 'This email is already subscribed and verified',
        });
      }

      // If not verified, always generate new token and resend email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      existingSubscriber.verificationToken = verificationToken;
      existingSubscriber.verificationTokenExpiry = verificationTokenExpiry;
      await existingSubscriber.save();

      // Send new verification email
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      const emailHtml = await generateVerificationEmail(normalizedEmail, verificationUrl);
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: 'Verify Your Email - Umbrella Stock',
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.error('Failed to resend verification email to:', normalizedEmail, '- Error:', emailResult.error);
      }

      return res.status(200).json({
        success: true,
        message: 'Your email is already registered but not verified. We have resent the verification email. Please check your inbox.',
        resent: true,
      });
    }

    // Create new subscriber
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const subscriber = await Subscriber.create({
      email: normalizedEmail,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
      isActive: true,
    });

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    const emailHtml = await generateVerificationEmail(normalizedEmail, verificationUrl);
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Verify Your Email - Umbrella Stock',
      html: emailHtml,
    });

    if (!emailResult.success) {
      // If email fails, log the error but still create the subscription
      console.error('Failed to send verification email to:', normalizedEmail, '- Error:', emailResult.error);
    }

    return res.status(201).json({
      success: true,
      message: 'Subscription successful! Please check your email to verify your subscription.',
      data: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt,
      },
    });
  } catch (error: any) {
    console.error('Subscribe API error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'This email is already subscribed',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing your subscription. Please try again.',
    });
  }
}
