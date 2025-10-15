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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const contact = await Contact.findById(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
      }

      return res.status(200).json({
        success: true,
        contact,
      });
    } catch (error: any) {
      console.error('Get contact error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch contact',
      });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { status } = req.body;

      if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value',
        });
      }

      const contact = await Contact.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Contact status updated successfully',
        contact,
      });
    } catch (error: any) {
      console.error('Update contact error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update contact',
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const contact = await Contact.findByIdAndDelete(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete contact error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete contact',
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }
}
