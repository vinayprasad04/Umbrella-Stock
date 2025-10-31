import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import { AuthUtils } from '@/lib/auth';
import { ActivityLogger } from '@/lib/activityLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    // Payment verified successfully - upgrade user to premium
    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const amount = 9900; // ₹99.00 in paise
    const startDate = new Date();
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    // Save payment record
    const payment = new Payment({
      userId: user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: amount,
      currency: 'INR',
      status: 'captured',
      plan: 'premium',
      description: 'Premium Annual Subscription',
      notes: {
        userEmail: user.email,
        userName: user.name
      }
    });

    await payment.save();

    // Store before state for logging
    const beforeState = {
      isPremium: user.isPremium,
      subscriptionStatus: user.subscription?.status
    };

    // Update user subscription and premium status
    user.subscription = {
      plan: 'premium',
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: amount,
      autoRenew: false
    };

    // Set isPremium flag (keep role as USER)
    user.isPremium = true;

    await user.save();

    // Log payment activity
    await ActivityLogger.logPayment(
      user._id,
      'payment_successful',
      {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amount,
        currency: 'INR',
        plan: 'premium',
        duration: '365 days'
      }
    );

    // Log subscription activation
    await ActivityLogger.logSubscriptionChange(
      user._id,
      user._id,
      'subscription_activated_payment',
      beforeState,
      {
        isPremium: user.isPremium,
        subscriptionStatus: user.subscription.status
      },
      {
        paymentId: razorpay_payment_id,
        amount: amount
      }
    );

    console.log('[Payment] User upgraded to premium:', {
      userId: user._id,
      role: user.role,
      isPremium: user.isPremium,
      subscription: user.subscription.status,
      paymentId: payment._id
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      subscription: user.subscription,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
    });
  }
}
