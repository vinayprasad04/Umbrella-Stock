import mongoose, { Schema, Document } from 'mongoose';

// Activity Types
export type ActivityType =
  | 'news-article'
  | 'news-video'
  | 'dividend'
  | 'announcement'
  | 'legal-order';

export type DividendType = 'interim' | 'final' | 'special';
export type AnnouncementCategory = 'corporate-action' | 'financial-results' | 'board-meeting' | 'other';
export type OrderType = 'sebi-order' | 'court-order' | 'regulatory';
export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface IAttachment {
  fileName: string;
  fileUrl: string;
  fileType?: string;
}

export interface IStockActivity extends Document {
  // Common Fields
  stockSymbol: string;
  activityType: ActivityType;
  headline: string;
  summary?: string;
  publishedAt: Date;
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  tags?: string[];

  // News Specific Fields
  feedType?: string;
  version?: string;

  // Dividend Specific Fields
  dividendAmount?: number;
  dividendType?: DividendType;
  exDate?: Date;
  recordDate?: Date;
  paymentDate?: Date;

  // Announcement Specific Fields
  announcementCategory?: AnnouncementCategory;
  attachments?: IAttachment[];

  // Legal Order Specific Fields
  orderType?: OrderType;
  jurisdiction?: string;
  caseNumber?: string;

  // Metadata
  isActive: boolean;
  sentiment?: Sentiment;
  priority?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String }
}, { _id: false });

const StockActivitySchema: Schema = new Schema({
  // Common Fields
  stockSymbol: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  activityType: {
    type: String,
    required: true,
    enum: ['news-article', 'news-video', 'dividend', 'announcement', 'legal-order'],
    index: true
  },
  headline: {
    type: String,
    required: true,
    index: 'text'
  },
  summary: {
    type: String,
    index: 'text'
  },
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    type: String
  },
  sourceUrl: {
    type: String
  },
  imageUrl: {
    type: String
  },
  tags: [{
    type: String
  }],

  // News Specific Fields
  feedType: {
    type: String
  },
  version: {
    type: String
  },

  // Dividend Specific Fields
  dividendAmount: {
    type: Number,
    min: 0
  },
  dividendType: {
    type: String,
    enum: ['interim', 'final', 'special']
  },
  exDate: {
    type: Date
  },
  recordDate: {
    type: Date
  },
  paymentDate: {
    type: Date
  },

  // Announcement Specific Fields
  announcementCategory: {
    type: String,
    enum: ['corporate-action', 'financial-results', 'board-meeting', 'other']
  },
  attachments: [AttachmentSchema],

  // Legal Order Specific Fields
  orderType: {
    type: String,
    enum: ['sebi-order', 'court-order', 'regulatory']
  },
  jurisdiction: {
    type: String
  },
  caseNumber: {
    type: String
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral']
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound Indexes for optimized queries
StockActivitySchema.index({ stockSymbol: 1, publishedAt: -1 });
StockActivitySchema.index({ stockSymbol: 1, activityType: 1, publishedAt: -1 });
StockActivitySchema.index({ activityType: 1, publishedAt: -1 });
StockActivitySchema.index({ isActive: 1, publishedAt: -1 });

// Prevent duplicate entries (same stock, type, headline, and date)
StockActivitySchema.index({
  stockSymbol: 1,
  activityType: 1,
  headline: 1,
  publishedAt: 1
}, { unique: true });

export default mongoose.models.StockActivity ||
  mongoose.model<IStockActivity>('StockActivity', StockActivitySchema);
