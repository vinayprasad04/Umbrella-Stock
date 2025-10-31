import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  action: string;
  category: 'subscription' | 'account' | 'payment' | 'auth' | 'profile' | 'admin';
  details: {
    before?: any;
    after?: any;
    metadata?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['subscription', 'account', 'payment', 'auth', 'profile', 'admin'],
    required: true,
    index: true
  },
  details: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Compound indexes for efficient querying
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ category: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
