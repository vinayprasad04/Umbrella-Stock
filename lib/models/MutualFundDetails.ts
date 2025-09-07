import mongoose, { Schema, Document } from 'mongoose';

// Interface for fund manager details
export interface IFundManager {
  name: string;
  experience?: string;
  qualification?: string;
}

// Interface for sector allocation
export interface ISectorAllocation {
  sector: string;
  allocation: number; // Percentage
}

// Interface for top holdings
export interface IHolding {
  company: string;
  allocation: number; // Percentage
  rank?: number;
}

// Interface for complete fund details
export interface IMutualFundDetails extends Document {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  
  // AUM and Expense Details
  aum?: number; // Assets Under Management
  expenseRatio?: number;
  
  // Investment Details
  minimumInvestment?: number;
  minimumSIP?: number;
  exitLoad?: string;
  launchDate?: string;
  
  // Fund Managers
  fundManagers: IFundManager[];
  
  // Portfolio Details
  topHoldings: IHolding[];
  sectorAllocation: ISectorAllocation[];
  
  // Data Quality Indicators
  dataSource: string; // 'API', 'SCRAPING', 'MANUAL', 'PLACEHOLDER'
  dataQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'PLACEHOLDER';
  lastScraped: Date;
  lastUpdated: Date;
  isActive: boolean;
  
  // Additional metadata
  totalHoldingsCount?: number;
  portfolioTurnover?: number;
  benchmark?: string;
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
}

const FundManagerSchema = new Schema({
  name: { type: String, required: true },
  experience: String,
  qualification: String
});

const SectorAllocationSchema = new Schema({
  sector: { type: String, required: true },
  allocation: { type: Number, required: true, min: 0, max: 100 }
});

const HoldingSchema = new Schema({
  company: { type: String, required: true },
  allocation: { type: Number, required: true, min: 0, max: 100 },
  rank: Number
});

const MutualFundDetailsSchema: Schema = new Schema({
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
  fundHouse: {
    type: String,
    required: true,
    index: true
  },
  
  // Financial Details
  aum: { type: Number, default: null },
  expenseRatio: { type: Number, default: null },
  
  // Investment Details
  minimumInvestment: { type: Number, default: null },
  minimumSIP: { type: Number, default: null },
  exitLoad: String,
  launchDate: String,
  
  // Fund Management
  fundManagers: [FundManagerSchema],
  
  // Portfolio Details
  topHoldings: [HoldingSchema],
  sectorAllocation: [SectorAllocationSchema],
  
  // Data Quality
  dataSource: {
    type: String,
    enum: ['API', 'SCRAPING', 'MANUAL', 'PLACEHOLDER'],
    required: true
  },
  dataQuality: {
    type: String,
    enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'PLACEHOLDER'],
    required: true,
    index: true
  },
  lastScraped: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Additional metadata
  totalHoldingsCount: Number,
  portfolioTurnover: Number,
  benchmark: String,
  riskLevel: {
    type: String,
    enum: ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
MutualFundDetailsSchema.index({ schemeCode: 1, isActive: 1 });
MutualFundDetailsSchema.index({ fundHouse: 1, dataQuality: 1 });
MutualFundDetailsSchema.index({ dataQuality: 1, lastScraped: -1 });
MutualFundDetailsSchema.index({ schemeName: 'text', fundHouse: 'text' });

// Compound index for data quality tracking
MutualFundDetailsSchema.index({ 
  isActive: 1, 
  dataQuality: 1, 
  lastScraped: -1 
});

export default mongoose.models.MutualFundDetails || 
  mongoose.model<IMutualFundDetails>('MutualFundDetails', MutualFundDetailsSchema);