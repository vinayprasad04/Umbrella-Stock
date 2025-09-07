import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import bcrypt from 'bcryptjs';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface SignupResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<SignupResponse>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();
    
    const { name, email, password, phone }: SignupRequest = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with USER role by default
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: 'USER', // Default role for new signups
      isActive: true,
      createdBy: 'self-registration'
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      },
      message: 'Account created successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    
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
      error: 'Registration failed'
    });
  }
}