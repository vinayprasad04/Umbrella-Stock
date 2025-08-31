import mongoose, { Schema, Document } from 'mongoose';

export interface IMutualFund extends Document {
  schemeCode: number;
  schemeName: string;
  isinGrowth?: string;
  isinDivReinvestment?: string;
  fundHouse?: string;
  category?: string;
  nav?: number;
  returns1Y?: number;
  returns3Y?: number;
  returns5Y?: number;
  expenseRatio?: number;
  aum?: number;
  lastUpdated: Date;
  isActive: boolean;
}

const MutualFundSchema: Schema = new Schema({
  schemeCode: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  schemeName: {
    type: String,
    required: true,
    index: 'text'
  },
  isinGrowth: {
    type: String,
    default: null
  },
  isinDivReinvestment: {
    type: String,
    default: null
  },
  fundHouse: {
    type: String,
    index: true
  },
  category: {
    type: String,
    index: true
  },
  nav: {
    type: Number,
    default: null
  },
  returns1Y: {
    type: Number,
    default: null
  },
  returns3Y: {
    type: Number,
    default: null
  },
  returns5Y: {
    type: Number,
    default: null
  },
  expenseRatio: {
    type: Number,
    default: null
  },
  aum: {
    type: Number,
    default: null
  },
  lastUpdated: {
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

// Text search index for scheme names
MutualFundSchema.index({
  schemeName: 'text',
  fundHouse: 'text'
});

// Compound indexes for common queries
MutualFundSchema.index({ category: 1, returns1Y: -1 });
MutualFundSchema.index({ fundHouse: 1, category: 1 });
MutualFundSchema.index({ isActive: 1, lastUpdated: -1 });

export default mongoose.models.MutualFund || mongoose.model<IMutualFund>('MutualFund', MutualFundSchema);