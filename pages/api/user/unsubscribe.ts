import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import { AuthUtils } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decodedToken = AuthUtils.verifyAccessToken(token);
    if (!decodedToken) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }

    await connectDB();

    if (req.method === 'GET') {
      // Check subscription status
      const subscriber = await Subscriber.findOne({
        email: decodedToken.email
      });

      return res.status(200).json({
        success: true,
        data: {
          isSubscribed: subscriber ? subscriber.isActive : false,
          isVerified: subscriber ? subscriber.isVerified : false,
          subscribedAt: subscriber?.subscribedAt,
        },
      });
    }

    if (req.method === 'POST') {
      const { action } = req.body;

      const subscriber = await Subscriber.findOne({
        email: decodedToken.email
      });

      if (!subscriber) {
        return res.status(404).json({
          success: false,
          error: 'You are not subscribed to our newsletter'
        });
      }

      if (action === 'unsubscribe') {
        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        return res.status(200).json({
          success: true,
          message: 'Successfully unsubscribed from newsletter',
        });
      }

      if (action === 'resubscribe') {
        subscriber.isActive = true;
        subscriber.unsubscribedAt = undefined;
        await subscriber.save();

        return res.status(200).json({
          success: true,
          message: 'Successfully resubscribed to newsletter',
        });
      }

      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
