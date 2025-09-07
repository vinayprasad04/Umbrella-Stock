import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import jwt from 'jsonwebtoken';

interface UpdateUserRequest {
  role?: 'ADMIN' | 'DATA_ENTRY' | 'SUBSCRIBER' | 'USER';
  isActive?: boolean;
  name?: string;
  phone?: string;
  department?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  const { userId } = req.query;

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    await connectDB();

    if (req.method === 'PATCH') {
      // Update user
      const updateData: UpdateUserRequest = req.body;

      // Find the user to update
      const userToUpdate = await User.findById(userId);
      
      if (!userToUpdate) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Prevent updating admin users (except by other admins)
      if (userToUpdate.role === 'ADMIN' && decoded.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Cannot update admin users',
        });
      }

      // Prevent admin from demoting themselves
      if (userToUpdate._id.toString() === decoded.userId && updateData.role && updateData.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Cannot change your own role',
        });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...updateData,
          lastActivity: new Date()
        },
        { 
          new: true, 
          runValidators: true,
          select: 'email name role permissions isActive lastLogin createdAt phone department totalMfDataEntered totalMfDataVerified'
        }
      );

      res.status(200).json({
        success: true,
        data: {
          id: updatedUser!._id.toString(),
          email: updatedUser!.email,
          name: updatedUser!.name,
          role: updatedUser!.role,
          permissions: updatedUser!.permissions,
          isActive: updatedUser!.isActive,
          lastLogin: updatedUser!.lastLogin?.toISOString(),
          createdAt: updatedUser!.createdAt.toISOString(),
          phone: updatedUser!.phone,
          department: updatedUser!.department,
          totalMfDataEntered: updatedUser!.totalMfDataEntered,
          totalMfDataVerified: updatedUser!.totalMfDataVerified
        },
        message: 'User updated successfully'
      });

    } else if (req.method === 'DELETE') {
      // Delete user (soft delete by setting isActive to false)
      const userToDelete = await User.findById(userId);
      
      if (!userToDelete) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Prevent deleting admin users
      if (userToDelete.role === 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete admin users',
        });
      }

      // Prevent admin from deleting themselves
      if (userToDelete._id.toString() === decoded.userId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete your own account',
        });
      }

      // Soft delete (deactivate)
      await User.findByIdAndUpdate(userId, { 
        isActive: false,
        lastActivity: new Date()
      });

      res.status(200).json({
        success: true,
        data: null,
        message: 'User deactivated successfully'
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

  } catch (error: any) {
    console.error('❌ Error in user update API:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}