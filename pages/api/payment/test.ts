import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TEST] Payment test endpoint called');

  return res.status(200).json({
    success: true,
    message: 'Payment API is reachable',
    timestamp: new Date().toISOString(),
    method: req.method,
    razorpayConfigured: {
      keyId: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      keySecret: !!process.env.RAZORPAY_KEY_SECRET,
    },
  });
}
