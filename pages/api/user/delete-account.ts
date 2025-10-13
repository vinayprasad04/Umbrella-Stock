import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { AuthUtils } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { password, reason } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required to delete account' });
    }

    // Find user
    const user = await User.findOne({
      email: decodedToken.email,
      deletedAt: null
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    // Soft delete: Mark account as deleted
    user.isActive = false;
    user.deletedAt = new Date();
    user.deleteReason = reason || 'User requested account deletion';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account has been deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
