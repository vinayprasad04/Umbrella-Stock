import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'DATA_ENTRY' | 'SUBSCRIBER' | 'USER';
  phone?: string;
  department?: string;
}

interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
  phone?: string;
  department?: string;
  totalMfDataEntered?: number;
  totalMfDataVerified?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const decoded = AuthUtils.verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    await connectDB();

    if (req.method === 'GET') {
      // Get users list
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const role = req.query.role as string || '';
      const status = req.query.status as string || '';

      // Build filter
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (role) {
        filter.role = role;
      }
      
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      }

      // Get users with pagination
      const skip = (page - 1) * limit;
      
      const users = await User.find(filter)
        .select('email name role permissions isActive lastLogin createdAt phone department totalMfDataEntered totalMfDataVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await User.countDocuments(filter);

      // Get role stats
      const roleStats = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      const roleStatsObj: { [key: string]: number } = {};
      roleStats.forEach((stat) => {
        roleStatsObj[stat._id] = stat.count;
      });

      const result: UserListItem[] = users.map(user => ({
        id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin?.toISOString(),
        createdAt: (user.createdAt as any).toISOString(),
        phone: user.phone,
        department: user.department,
        totalMfDataEntered: user.totalMfDataEntered,
        totalMfDataVerified: user.totalMfDataVerified
      }));

      res.status(200).json({
        success: true,
        data: {
          users: result,
          total,
          page,
          limit,
          roleStats: roleStatsObj
        },
        message: 'Users retrieved successfully'
      });

    } else if (req.method === 'POST') {
      // Create new user
      const userData: CreateUserRequest = req.body;

      // Validation
      if (!userData.name || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required',
        });
      }

      if (userData.password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ 
        email: userData.email.toLowerCase() 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Get admin info for tracking
      const adminUser = await User.findById(decoded.userId);

      // Create new user
      const newUser = await User.create({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'USER',
        phone: userData.phone,
        department: userData.department,
        isActive: true,
        createdBy: adminUser?.name || decoded.email
      });

      res.status(201).json({
        success: true,
        data: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        },
        message: 'User created successfully'
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

  } catch (error: any) {
    console.error('❌ Error in users API:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

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