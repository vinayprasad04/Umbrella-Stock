import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils, AuthTokens } from '@/lib/auth';

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<RefreshResponse>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { refreshToken }: RefreshRequest = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = AuthUtils.verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    // Connect to database and verify user still exists and is active
    await connectDB();
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    // Generate new tokens
    const newTokens = AuthUtils.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Update user's last activity
    user.lastActivity = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
        refreshExpiresIn: newTokens.refreshExpiresIn
      },
      message: 'Tokens refreshed successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Token refresh error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
}