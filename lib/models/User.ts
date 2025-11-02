import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'DATA_ENTRY' | 'SUBSCRIBER' | 'USER';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdBy?: string;
  
  // Profile Information
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;

  // OAuth Information
  oauthProvider?: 'google' | 'microsoft';
  oauthProviderId?: string;
  
  // User Preferences
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    timezone: string;
  };
  
  // Notification Settings
  notifications?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  
  // Activity Tracking
  totalMfDataEntered?: number;
  totalMfDataVerified?: number;
  lastActivity?: Date;
  
  // Password Management
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;

  // Email Verification
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  // Premium Status (for paid users who remain as USER role)
  isPremium?: boolean;

  // Subscription
  subscription?: {
    plan: 'free' | 'premium';
    status: 'active' | 'expired' | 'cancelled';
    startDate: Date;
    endDate: Date;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    autoRenew?: boolean;
  };

  // Soft Delete
  deletedAt?: Date;
  deleteReason?: string;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'DATA_ENTRY', 'SUBSCRIBER', 'USER'],
    required: true,
    default: 'USER',
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      'VIEW_DASHBOARD',
      'ENTER_MF_DATA',
      'VERIFY_MF_DATA', 
      'EDIT_MF_DATA',
      'DELETE_MF_DATA',
      'MANAGE_USERS',
      'VIEW_ANALYTICS',
      'EXPORT_DATA'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: Date,
  createdBy: String,
  
  // Profile Information
  phone: String,
  department: String,
  location: String,
  bio: { type: String, maxlength: 500 },
  avatar: String,
  profilePicture: String,
  isEmailVerified: { type: Boolean, default: false },
  lastLoginAt: Date,

  // OAuth Information
  oauthProvider: { type: String, enum: ['google', 'microsoft'] },
  oauthProviderId: String,
  
  // User Preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  
  // Notification Settings
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false }
  },
  
  // Activity Tracking
  totalMfDataEntered: { type: Number, default: 0 },
  totalMfDataVerified: { type: Number, default: 0 },
  lastActivity: Date,
  
  // Password Management
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,

  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // Premium Status
  isPremium: { type: Boolean, default: false },

  // Subscription
  subscription: {
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    startDate: Date,
    endDate: Date,
    paymentId: String,
    orderId: String,
    amount: Number,
    autoRenew: { type: Boolean, default: false }
  },

  // Soft Delete
  deletedAt: Date,
  deleteReason: String
}, {
  timestamps: true
});

// Pre-save hook to set permissions based on role
UserSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'ADMIN':
        this.permissions = [
          'VIEW_DASHBOARD',
          'ENTER_MF_DATA',
          'VERIFY_MF_DATA',
          'EDIT_MF_DATA',
          'DELETE_MF_DATA',
          'MANAGE_USERS',
          'VIEW_ANALYTICS',
          'EXPORT_DATA'
        ];
        break;
      case 'DATA_ENTRY':
        this.permissions = [
          'VIEW_DASHBOARD',
          'ENTER_MF_DATA',
          'EDIT_MF_DATA',
          'VIEW_ANALYTICS'
        ];
        break;
      case 'SUBSCRIBER':
        this.permissions = [
          'VIEW_DASHBOARD',
          'VIEW_ANALYTICS'
        ];
        break;
      case 'USER':
        this.permissions = [];
        break;
    }
  }
  next();
});

// Indexes
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ role: 1, isActive: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);