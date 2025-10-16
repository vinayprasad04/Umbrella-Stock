import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import bcrypt from 'bcryptjs';
import { AuthUtils, AuthTokens } from '@/lib/auth';
import { withAuthSecurity } from '@/lib/security';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<LoginResponse>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();
    
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
      deletedAt: null  // Exclude soft-deleted accounts
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if email is verified (skip for admin users)
    if (user.role === 'USER' && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      } as any);
    }

    // Check hashed password for all users (including admin)
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    await user.save();

    // Generate access and refresh tokens
    const tokens = AuthUtils.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn
      },
      message: 'Login successful'
    });
    
  } catch (error: any) {
    console.error('❌ Login error:', error);

    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

// Apply security middleware
export default withAuthSecurity(loginHandler);