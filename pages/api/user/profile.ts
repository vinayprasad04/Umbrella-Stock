import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
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

    if (req.method === 'GET') {
      // Get user profile
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions || [],
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          avatar: user.avatar,
          joinedAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          isEmailVerified: user.isEmailVerified,
          preferences: user.preferences || {
            theme: 'light',
            language: 'en',
            currency: 'INR',
            timezone: 'Asia/Kolkata'
          },
          notifications: user.notifications || {
            email: true,
            push: true,
            marketing: false
          }
        },
      });
    }

    if (req.method === 'PUT') {
      // Update user profile
      const { name, phone, location, bio, preferences, notifications } = req.body;

      // Validation
      if (name && (typeof name !== 'string' || name.trim().length < 2)) {
        return res.status(400).json({
          success: false,
          error: 'Name must be at least 2 characters long',
        });
      }

      if (phone && (typeof phone !== 'string' || !/^[\+]?[0-9\s\-\(\)]+$/.test(phone))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format',
        });
      }

      if (bio && typeof bio === 'string' && bio.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Bio must be less than 500 characters',
        });
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date()
      };

      if (name) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone.trim();
      if (location !== undefined) updateData.location = location.trim();
      if (bio !== undefined) updateData.bio = bio.trim();
      if (preferences) updateData.preferences = preferences;
      if (notifications) updateData.notifications = notifications;

      const updatedUser = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          permissions: updatedUser.permissions || [],
          phone: updatedUser.phone,
          location: updatedUser.location,
          bio: updatedUser.bio,
          avatar: updatedUser.avatar,
          joinedAt: updatedUser.createdAt,
          lastLoginAt: updatedUser.lastLoginAt,
          isEmailVerified: updatedUser.isEmailVerified,
          preferences: updatedUser.preferences,
          notifications: updatedUser.notifications
        },
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });

  } catch (error: any) {
    console.error('❌ Profile API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}