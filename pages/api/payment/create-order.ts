import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { verifyToken } from '@/lib/auth';

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

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Check if Razorpay keys are configured
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('your_') || keySecret.includes('your_')) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay is not configured. Please add your API keys to environment variables.',
      });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create order
    const options = {
      amount: 9900, // ₹99 in paise (99 * 100)
      currency: 'INR',
      receipt: `receipt_${decoded.userId}_${Date.now()}`,
      notes: {
        userId: decoded.userId,
        email: decoded.email,
        planType: 'premium',
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment order',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
    });
  }
}
