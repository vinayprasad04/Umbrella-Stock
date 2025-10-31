import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  await connectDB();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Fetch payment history for the user
    const payments = await Payment.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .select('orderId paymentId amount currency status plan description createdAt')
      .lean();

    return res.status(200).json({
      success: true,
      data: payments,
    });

  } catch (error: any) {
    console.error('❌ Payment History API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
