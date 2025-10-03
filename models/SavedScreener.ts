import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface ISavedScreener extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  filters: {
    search: string;
    sector: string[];
    niftyIndices: string[];
    minMarketCap: string;
    maxMarketCap: string;
    minPrice: string;
    maxPrice: string;
    minPE: string;
    maxPE: string;
    minROCE: string;
    maxROCE: string;
    minROE: string;
    maxROE: string;
    minDebtToEquity: string;
    maxDebtToEquity: string;
    minPB: string;
    maxPB: string;
    minDividendYield: string;
    maxDividendYield: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  createdAt: Date;
  updatedAt: Date;
}

const SavedScreenerSchema = new Schema<ISavedScreener>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  filters: {
    search: { type: String, default: '' },
    sector: [{ type: String }],
    niftyIndices: [{ type: String }],
    minMarketCap: { type: String, default: '' },
    maxMarketCap: { type: String, default: '' },
    minPrice: { type: String, default: '' },
    maxPrice: { type: String, default: '' },
    minPE: { type: String, default: '' },
    maxPE: { type: String, default: '' },
    minROCE: { type: String, default: '' },
    maxROCE: { type: String, default: '' },
    minROE: { type: String, default: '' },
    maxROE: { type: String, default: '' },
    minDebtToEquity: { type: String, default: '' },
    maxDebtToEquity: { type: String, default: '' },
    minPB: { type: String, default: '' },
    maxPB: { type: String, default: '' },
    minDividendYield: { type: String, default: '' },
    maxDividendYield: { type: String, default: '' },
    sortBy: { type: String, default: 'meta.marketCapitalization' },
    sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' },
  },
}, {
  timestamps: true,
});

SavedScreenerSchema.index({ userId: 1, createdAt: -1 });

export default models.SavedScreener || model<ISavedScreener>('SavedScreener', SavedScreenerSchema);
