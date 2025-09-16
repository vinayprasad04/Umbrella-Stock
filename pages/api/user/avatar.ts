import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

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

    const { avatar } = req.body;

    // Validation
    if (!avatar) {
      return res.status(400).json({
        success: false,
        error: 'Avatar data is required',
      });
    }

    // Validate base64 image
    if (!avatar.startsWith('/9j/') && !avatar.startsWith('iVBOR') && !avatar.startsWith('UklG')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format',
      });
    }

    // Check image size (base64 encoded, so roughly 1.33x the actual size)
    const sizeInBytes = (avatar.length * 3) / 4;
    const sizeInKB = sizeInBytes / 1024;
    
    if (sizeInKB > 15) { // Allow a bit more than 10KB for base64 overhead
      return res.status(400).json({
        success: false,
        error: 'Image is too large. Please upload a smaller image.',
      });
    }

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      {
        avatar: `data:image/jpeg;base64,${avatar}`,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        avatar: updatedUser.avatar
      }
    });

  } catch (error: any) {
    console.error('❌ Avatar Upload API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}