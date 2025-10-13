import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  isVerified: boolean;
  verificationToken: string;
  verificationTokenExpiry: Date;
  subscribedAt: Date;
  verifiedAt?: Date;
  unsubscribedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: true,
    },
    verificationTokenExpiry: {
      type: Date,
      required: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    unsubscribedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SubscriberSchema.index({ email: 1 });
SubscriberSchema.index({ isVerified: 1 });
SubscriberSchema.index({ isActive: 1 });
SubscriberSchema.index({ verificationToken: 1 });

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
