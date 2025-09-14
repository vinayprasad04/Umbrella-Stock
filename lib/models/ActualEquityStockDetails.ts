import mongoose, { Schema, Document } from 'mongoose';

export interface IActualEquityStockDetails extends Document {
  symbol: string;
  sector: string;
  industry: string;
  marketCap: number;
  currentPrice: number;
  exchange: string;
  dataQuality: 'PENDING_VERIFICATION' | 'VERIFIED' | 'EXCELLENT' | 'GOOD';
  enteredBy: string;
  isActive: boolean;
  lastUpdated: Date;
  pe?: number;
  pb?: number;
  roe?: number;
  dividendYield?: number;
  bookValue?: number;
  eps?: number;
  revenue?: number;
  profit?: number;
  netWorth?: number;
  description?: string;
  website?: string;
  managementTeam?: string[];
  keyMetrics?: {
    debtToEquity?: number;
    currentRatio?: number;
    quickRatio?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    profitMargin?: number;
    operatingMargin?: number;
  };
}

const ActualEquityStockDetailsSchema: Schema = new Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  sector: {
    type: String,
    required: true,
    index: true
  },
  industry: {
    type: String,
    index: true
  },
  marketCap: {
    type: Number,
    required: true,
    index: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  exchange: {
    type: String,
    required: true,
    enum: ['NSE', 'BSE', 'BOTH'],
    default: 'NSE'
  },
  dataQuality: {
    type: String,
    required: true,
    enum: ['PENDING_VERIFICATION', 'VERIFIED', 'EXCELLENT', 'GOOD'],
    default: 'PENDING_VERIFICATION',
    index: true
  },
  enteredBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Financial metrics
  pe: {
    type: Number
  },
  pb: {
    type: Number
  },
  roe: {
    type: Number
  },
  dividendYield: {
    type: Number
  },
  bookValue: {
    type: Number
  },
  eps: {
    type: Number
  },
  revenue: {
    type: Number
  },
  profit: {
    type: Number
  },
  netWorth: {
    type: Number
  },
  description: {
    type: String
  },
  website: {
    type: String
  },
  managementTeam: [{
    type: String
  }],
  keyMetrics: {
    debtToEquity: { type: Number },
    currentRatio: { type: Number },
    quickRatio: { type: Number },
    returnOnAssets: { type: Number },
    returnOnEquity: { type: Number },
    profitMargin: { type: Number },
    operatingMargin: { type: Number }
  }
}, {
  timestamps: true
});

// Indexes for performance
ActualEquityStockDetailsSchema.index({ symbol: 1, isActive: 1 });
ActualEquityStockDetailsSchema.index({ sector: 1, isActive: 1 });
ActualEquityStockDetailsSchema.index({ exchange: 1, isActive: 1 });
ActualEquityStockDetailsSchema.index({ dataQuality: 1, isActive: 1 });
ActualEquityStockDetailsSchema.index({ marketCap: -1 });
ActualEquityStockDetailsSchema.index({ lastUpdated: -1 });

export default mongoose.models.ActualEquityStockDetails ||
  mongoose.model<IActualEquityStockDetails>('ActualEquityStockDetails', ActualEquityStockDetailsSchema);