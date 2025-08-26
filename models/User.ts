import mongoose, { Schema, model, models } from 'mongoose';
import { User } from '@/types';

const UserSchema = new Schema<User>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  watchlist: [{
    type: String,
    uppercase: true,
  }],
  searchHistory: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

UserSchema.index({ email: 1 });

export default models.User || model<User>('User', UserSchema);