import mongoose, { Schema, Document } from 'mongoose';

export interface IEquityStock extends Document {
  symbol: string;
  companyName: string;
  series: string;
  dateOfListing: Date;
  paidUpValue: number;
  marketLot: number;
  isinNumber: string;
  faceValue: number;
  sector?: string;
  isActive: boolean;
  hasActualData: boolean;
  lastUpdated: Date;
}

const EquityStockSchema: Schema = new Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  companyName: {
    type: String,
    required: true,
    index: 'text'
  },
  series: {
    type: String,
    required: true,
    index: true
  },
  dateOfListing: {
    type: Date,
    required: true
  },
  paidUpValue: {
    type: Number,
    required: true
  },
  marketLot: {
    type: Number,
    required: true
  },
  isinNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  faceValue: {
    type: Number,
    required: true
  },
  sector: {
    type: String,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hasActualData: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Text search index for symbols and company names
EquityStockSchema.index({
  symbol: 'text',
  companyName: 'text'
});

// Compound indexes for common queries
EquityStockSchema.index({ series: 1, isActive: 1 });
EquityStockSchema.index({ dateOfListing: -1 });
EquityStockSchema.index({ isActive: 1, lastUpdated: -1 });

export default mongoose.models.EquityStock || mongoose.model<IEquityStock>('EquityStock', EquityStockSchema);