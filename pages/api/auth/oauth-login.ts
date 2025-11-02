import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import { withAuthSecurity } from '@/lib/security';
import bcrypt from 'bcryptjs';

interface OAuthLoginRequest {
  email: string;
  name: string;
  provider: 'google' | 'microsoft';
  providerId: string;
  photoUrl?: string;
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

async function oauthLoginHandler(
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
    console.log('[OAuth] Starting OAuth login process...');
    await connectDB();
    console.log('[OAuth] Database connected successfully');

    const { email, name, provider, providerId, photoUrl }: OAuthLoginRequest = req.body;
    console.log('[OAuth] Request data:', { email, name, provider, providerId });

    if (!email || !name || !provider || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check if user exists
    console.log('[OAuth] Checking if user exists...');
    let user = await User.findOne({
      email: email.toLowerCase(),
      deletedAt: null
    });
    console.log('[OAuth] User found:', user ? 'Yes' : 'No');

    if (user) {
      // User exists - update OAuth info if needed
      if (!user.oauthProvider) {
        user.oauthProvider = provider;
        user.oauthProviderId = providerId;
      }

      // Mark email as verified for OAuth users
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
      }

      // Update photo if provided
      if (photoUrl && !user.profilePicture) {
        user.profilePicture = photoUrl;
      }

      // Activate user if inactive
      if (!user.isActive) {
        user.isActive = true;
      }

      user.lastLogin = new Date();
      user.lastActivity = new Date();
      await user.save();
    } else {
      // Create new user from OAuth
      console.log('[OAuth] Creating new user...');
      // Generate a random password that won't be used (OAuth users don't use password login)
      // Using 4 rounds for OAuth users since they won't use password login anyway
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      console.log('[OAuth] Hashing password...');
      const hashedPassword = await bcrypt.hash(randomPassword, 4);
      console.log('[OAuth] Password hashed, creating user in database...');

      user = await User.create({
        email: email.toLowerCase(),
        name: name,
        password: hashedPassword,
        role: 'USER',
        oauthProvider: provider,
        oauthProviderId: providerId,
        profilePicture: photoUrl || undefined,
        isEmailVerified: true, // OAuth emails are pre-verified
        isActive: true,
        permissions: [],
        lastLogin: new Date(),
        lastActivity: new Date(),
      });
      console.log('[OAuth] User created successfully');
    }

    // Generate access and refresh tokens
    console.log('[OAuth] Generating JWT tokens...');
    const tokens = AuthUtils.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    console.log('[OAuth] Tokens generated successfully');
    console.log('[OAuth] Sending success response...');

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
      message: 'OAuth login successful'
    });

  } catch (error: any) {
    console.error('OAuth login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    res.status(500).json({
      success: false,
      error: 'OAuth login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Apply security middleware
// Temporarily export without middleware for debugging
export default oauthLoginHandler;
// export default withAuthSecurity(oauthLoginHandler);
