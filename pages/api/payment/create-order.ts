import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { AuthUtils } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('[Payment] Create order request received');

    // Verify user authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('[Payment] No token provided');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    console.log('[Payment] Verifying token...');
    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded) {
      console.log('[Payment] Invalid token');
      return res.status(401).json({ success: false, error: 'Invalid or expired token. Please log in again.' });
    }

    console.log('[Payment] User authenticated:', decoded.userId);

    // Check if Razorpay keys are configured
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log('[Payment] Checking Razorpay config...', {
      keyIdExists: !!keyId,
      keySecretExists: !!keySecret,
      keyId: keyId?.substring(0, 10) + '...',
    });

    if (!keyId || !keySecret || keyId.includes('your_') || keySecret.includes('your_')) {
      console.log('[Payment] Razorpay not configured properly');
      return res.status(500).json({
        success: false,
        error: 'Razorpay is not configured. Please contact support.',
      });
    }

    // Initialize Razorpay
    console.log('[Payment] Initializing Razorpay...');
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

    console.log('[Payment] Creating Razorpay order...');
    const order = await razorpay.orders.create(options);

    console.log('[Payment] Order created successfully:', order.id);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('[Payment] Error creating Razorpay order:', error);
    console.error('[Payment] Error stack:', error.stack);

    // More specific error messages
    let errorMessage = 'Failed to create payment order';
    if (error.message?.includes('Invalid API key') || error.message?.includes('authentication')) {
      errorMessage = 'Payment gateway configuration error. Please contact support.';
    } else if (error.message?.includes('network') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Unable to connect to payment gateway. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
    });
  }
}
