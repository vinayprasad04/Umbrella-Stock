import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import bcryptjs from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'PUT') {
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

    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
      });
    }

    // Get user with password
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Check if new password is different from current
    const isSamePassword = await bcryptjs.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcryptjs.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(decoded.userId, {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('❌ Change Password API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}