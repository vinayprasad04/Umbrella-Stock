import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string; // e.g., 'verification', 'welcome', etc.
  subject: string;
  heading: string;
  bodyText: string;
  buttonText: string;
  footerText: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      default: 'Verify Your Email - Umbrella Stock',
    },
    heading: {
      type: String,
      required: true,
      default: 'Verify Your Email Address',
    },
    bodyText: {
      type: String,
      required: true,
      default: 'Thank you for subscribing to Umbrella Stock! To complete your subscription and start receiving market insights, investment updates, and exclusive content, please verify your email address by clicking the button below.',
    },
    buttonText: {
      type: String,
      required: true,
      default: 'Verify Email Address',
    },
    footerText: {
      type: String,
      default: "If you didn't subscribe to Umbrella Stock, you can safely ignore this email.",
    },
    primaryColor: {
      type: String,
      default: '#FF6B2C', // Orange gradient start color
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

// Create indexes
EmailTemplateSchema.index({ name: 1 });
EmailTemplateSchema.index({ isActive: 1 });

const EmailTemplate: Model<IEmailTemplate> =
  mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export default EmailTemplate;
