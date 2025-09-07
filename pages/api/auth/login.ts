import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
  token: string;
}

export default async function handler(
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
      isActive: true 
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // For the initial admin user, check plain text password
    // In production, you should hash passwords
    let passwordMatch = false;
    
    if (email === 'vinay.qss@gmail.com' && password === '654321') {
      passwordMatch = true;
    } else {
      // For other users, check hashed password
      passwordMatch = await bcrypt.compare(password, user.password);
    }
    
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

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
        token
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