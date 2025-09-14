import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchlist extends Document {
  userId: string;
  email: string;
  symbol: string;
  companyName: string;
  type: 'STOCK' | 'MUTUAL_FUND';
  addedAt: Date;
  isActive: boolean;
}

const WatchlistSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  companyName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['STOCK', 'MUTUAL_FUND'],
    default: 'STOCK'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate watchlist entries
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

// Index for efficient user queries
WatchlistSchema.index({ email: 1, isActive: 1 });

export default mongoose.models.Watchlist || mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);