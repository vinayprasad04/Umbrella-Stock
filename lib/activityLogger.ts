import ActivityLog from './models/ActivityLog';
import mongoose from 'mongoose';

interface LogActivityParams {
  userId: string | mongoose.Types.ObjectId;
  adminId?: string | mongoose.Types.ObjectId;
  action: string;
  category: 'subscription' | 'account' | 'payment' | 'auth' | 'profile' | 'admin';
  details?: {
    before?: any;
    after?: any;
    metadata?: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityLogger {
  static async log(params: LogActivityParams): Promise<void> {
    try {
      await ActivityLog.create({
        userId: params.userId,
        adminId: params.adminId,
        action: params.action,
        category: params.category,
        details: params.details || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error - logging failure shouldn't break the main operation
    }
  }

  // Convenience methods for common actions
  static async logSubscriptionChange(
    userId: string | mongoose.Types.ObjectId,
    adminId: string | mongoose.Types.ObjectId,
    action: string,
    before: any,
    after: any,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      adminId,
      action,
      category: 'subscription',
      details: { before, after, metadata }
    });
  }

  static async logPayment(
    userId: string | mongoose.Types.ObjectId,
    action: string,
    paymentDetails: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'payment',
      details: { metadata: paymentDetails }
    });
  }

  static async logAuth(
    userId: string | mongoose.Types.ObjectId,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'auth',
      ipAddress,
      userAgent
    });
  }

  static async logProfileChange(
    userId: string | mongoose.Types.ObjectId,
    action: string,
    before: any,
    after: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'profile',
      details: { before, after }
    });
  }

  static async logAdminAction(
    userId: string | mongoose.Types.ObjectId,
    adminId: string | mongoose.Types.ObjectId,
    action: string,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      adminId,
      action,
      category: 'admin',
      details: { metadata: details }
    });
  }
}
