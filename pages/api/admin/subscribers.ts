import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import { AuthUtils } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication and admin role
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decodedToken = AuthUtils.verifyAccessToken(token);
    if (!decodedToken || !['ADMIN', 'DATA_ENTRY'].includes(decodedToken.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await connectDB();

    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin subscribers API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {
    page = '1',
    limit = '20',
    search = '',
    status = 'all', // all, verified, unverified, active, inactive
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query: any = {};

  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  if (status === 'verified') {
    query.isVerified = true;
  } else if (status === 'unverified') {
    query.isVerified = false;
  } else if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  // Build sort
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [subscribers, total] = await Promise.all([
    Subscriber.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Subscriber.countDocuments(query),
  ]);

  // Get statistics
  const stats = await Subscriber.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        verified: [{ $match: { isVerified: true } }, { $count: 'count' }],
        unverified: [{ $match: { isVerified: false } }, { $count: 'count' }],
        active: [{ $match: { isActive: true } }, { $count: 'count' }],
      },
    },
  ]);

  const statistics = {
    total: stats[0]?.total[0]?.count || 0,
    verified: stats[0]?.verified[0]?.count || 0,
    unverified: stats[0]?.unverified[0]?.count || 0,
    active: stats[0]?.active[0]?.count || 0,
  };

  return res.status(200).json({
    success: true,
    data: {
      subscribers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      statistics,
    },
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { action, id, email } = req.body;

  if (action === 'toggle-active' && id) {
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }

    subscriber.isActive = !subscriber.isActive;
    if (!subscriber.isActive) {
      subscriber.unsubscribedAt = new Date();
    }
    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: `Subscriber ${subscriber.isActive ? 'activated' : 'deactivated'} successfully`,
      data: subscriber,
    });
  }

  if (action === 'verify' && id) {
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }

    if (subscriber.isVerified) {
      return res.status(400).json({ success: false, error: 'Subscriber already verified' });
    }

    subscriber.isVerified = true;
    subscriber.verifiedAt = new Date();
    await subscriber.save();

    return res.status(200).json({
      success: true,
      message: 'Subscriber verified successfully',
      data: subscriber,
    });
  }

  return res.status(400).json({ success: false, error: 'Invalid action' });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Subscriber ID is required' });
  }

  const subscriber = await Subscriber.findByIdAndDelete(id);

  if (!subscriber) {
    return res.status(404).json({ success: false, error: 'Subscriber not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Subscriber deleted successfully',
  });
}
