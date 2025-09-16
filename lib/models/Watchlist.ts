import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchlist extends Document {
  userId: string;
  email: string;
  symbol: string;
  companyName: string;
  type: 'STOCK' | 'MUTUAL_FUND';
  addedAt: Date;
  isActive: boolean;
  order: number;
  watchlistId: number; // 1-5 for different tabs
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
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  watchlistId: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 5,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate watchlist entries per tab
WatchlistSchema.index({ userId: 1, symbol: 1, watchlistId: 1 }, { unique: true });

// Index for efficient user queries
WatchlistSchema.index({ email: 1, isActive: 1 });

export default mongoose.models.Watchlist || mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);