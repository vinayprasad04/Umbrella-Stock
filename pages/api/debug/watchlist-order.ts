import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Watchlist from '@/lib/models/Watchlist';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await connectDB();

    // Get all watchlist items for this user
    const items = await Watchlist.find({
      userId: decoded.userId,
      isActive: true
    }).lean();

    // Check the schema of the items
    const debug = {
      user: decoded.userId,
      totalItems: items.length,
      itemsWithOrder: items.filter((item: any) => item.order !== undefined && item.order !== null).length,
      itemsWithoutOrder: items.filter((item: any) => item.order === undefined || item.order === null).length,
      sampleItems: items.slice(0, 3).map((item: any) => ({
        id: item._id?.toString(),
        symbol: item.symbol,
        order: item.order,
        addedAt: item.addedAt,
        hasOrderField: 'order' in item,
        orderType: typeof item.order
      })),
      allOrders: items.map((item: any) => ({ symbol: item.symbol, order: item.order })).sort((a, b) => (a.order || 999) - (b.order || 999))
    };

    return res.status(200).json(debug);

  } catch (error) {
    console.error('Debug API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}