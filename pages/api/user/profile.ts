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
          passwordChangedAt: user.passwordChangedAt,
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
      const { name, email, phone, location, bio, preferences, notifications } = req.body;

      // Validation for name
      if (name && (typeof name !== 'string' || name.trim().length < 1)) {
        return res.status(400).json({
          success: false,
          error: 'Name is required and must be at least 1 character',
        });
      }

      if (name && name.trim().length > 40) {
        return res.status(400).json({
          success: false,
          error: 'Name must not exceed 40 characters',
        });
      }

      // Validation for email
      if (email && (typeof email !== 'string' || email.trim().length > 60)) {
        return res.status(400).json({
          success: false,
          error: 'Email must not exceed 60 characters',
        });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      // Validation for phone
      if (phone && typeof phone === 'string' && phone.length > 15) {
        return res.status(400).json({
          success: false,
          error: 'Phone number must not exceed 15 characters',
        });
      }

      if (phone && phone.length > 0 && !/^[\+]?[0-9\s\-\(\)]+$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Only numbers, spaces, +, -, and () are allowed',
        });
      }

      // Validation for location
      if (location && typeof location === 'string' && location.length > 150) {
        return res.status(400).json({
          success: false,
          error: 'Location must not exceed 150 characters',
        });
      }

      // Validation for bio
      if (bio && typeof bio === 'string' && bio.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Bio must not exceed 500 characters',
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