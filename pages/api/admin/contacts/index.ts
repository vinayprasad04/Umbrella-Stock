import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { AuthUtils } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  // Verify authentication and admin role
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const decoded = AuthUtils.verifyAccessToken(token);

  if (!decoded || !['ADMIN', 'SUPER_ADMIN'].includes(decoded.role)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin access required.',
    });
  }

  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter
      const filter: any = {};

      if (status && status !== 'all') {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await Contact.countDocuments(filter);

      // Get contacts with pagination
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const contacts = await Contact.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Get status counts
      const statusCounts = await Contact.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const counts = {
        all: total,
        new: 0,
        read: 0,
        replied: 0,
        archived: 0,
      };

      statusCounts.forEach((item) => {
        if (item._id in counts) {
          counts[item._id as keyof typeof counts] = item.count;
        }
      });

      return res.status(200).json({
        success: true,
        contacts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        counts,
      });
    } catch (error: any) {
      console.error('Get contacts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch contacts',
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }
}
