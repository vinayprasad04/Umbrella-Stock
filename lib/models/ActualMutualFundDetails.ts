import mongoose, { Schema, Document } from 'mongoose';

// Interface for actual fund manager details
export interface IActualFundManager {
  name: string;
  experience?: string;
  qualification?: string;
  tenure?: string; // How long managing this fund
  background?: string;
}

// Interface for actual sector allocation
export interface IActualSectorAllocation {
  sector: string;
  allocation: number; // Percentage
  lastUpdated?: Date;
}

// Interface for actual top holdings
export interface IActualHolding {
  company: string;
  allocation: number; // Percentage
  rank?: number;
  isin?: string; // ISIN of the holding
  lastUpdated?: Date;
}

// Interface for actual fund performance
export interface IActualPerformance {
  returns1Y?: number;
  returns3Y?: number;
  returns5Y?: number;
  returns10Y?: number;
  sinceInception?: number;
  lastUpdated?: Date;
}

// Interface for complete ACTUAL fund details
export interface IActualMutualFundDetails extends Document {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  
  // Basic Fund Information
  aum?: number; // Assets Under Management (actual)
  expenseRatio?: number; // Actual expense ratio
  nav?: number; // Current NAV
  
  // Investment Details
  minimumInvestment?: number;
  minimumSIP?: number;
  exitLoad?: string;
  launchDate?: Date;
  
  // Fund Management (ACTUAL)
  actualFundManagers: IActualFundManager[];
  
  // Portfolio Details (ACTUAL)
  actualTopHoldings: IActualHolding[];
  actualSectorAllocation: IActualSectorAllocation[];
  
  // Performance (ACTUAL)
  actualPerformance?: IActualPerformance;
  
  // Additional Details
  benchmark?: string;
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  fundObjective?: string;
  investmentStrategy?: string;
  
  // Data Quality & Source
  dataSource: string; // 'MANUAL_ENTRY', 'VERIFIED_API', 'FUND_HOUSE_OFFICIAL'
  dataQuality: 'VERIFIED' | 'PENDING_VERIFICATION' | 'EXCELLENT' | 'GOOD';
  
  // Tracking Information
  enteredBy: string; // User email who entered the data
  verifiedBy?: string; // Admin email who verified
  lastUpdated: Date;
  lastVerified?: Date;
  isActive: boolean;
  
  // Source Information
  sourceUrl?: string; // Where the data was obtained from
  factsheetDate?: Date; // Date of the factsheet used
  dataEntryNotes?: string; // Notes about the data entry
}

const ActualFundManagerSchema = new Schema({
  name: { type: String, required: true },
  experience: String,
  qualification: String,
  tenure: String,
  background: String
});

const ActualSectorAllocationSchema = new Schema({
  sector: { type: String, required: true },
  allocation: { type: Number, required: true, min: 0, max: 100 },
  lastUpdated: { type: Date, default: Date.now }
});

const ActualHoldingSchema = new Schema({
  company: { type: String, required: true },
  allocation: { type: Number, required: true, min: 0, max: 100 },
  rank: Number,
  isin: String,
  lastUpdated: { type: Date, default: Date.now }
});

const ActualPerformanceSchema = new Schema({
  returns1Y: Number,
  returns3Y: Number,
  returns5Y: Number,
  returns10Y: Number,
  sinceInception: Number,
  lastUpdated: { type: Date, default: Date.now }
});

const ActualMutualFundDetailsSchema: Schema = new Schema({
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
  
  // Financial Details (ACTUAL)
  aum: { type: Number, default: null },
  expenseRatio: { type: Number, default: null },
  nav: { type: Number, default: null },
  
  // Investment Details
  minimumInvestment: { type: Number, default: null },
  minimumSIP: { type: Number, default: null },
  exitLoad: String,
  launchDate: Date,
  
  // Fund Management (ACTUAL)
  actualFundManagers: [ActualFundManagerSchema],
  
  // Portfolio Details (ACTUAL)
  actualTopHoldings: [ActualHoldingSchema],
  actualSectorAllocation: [ActualSectorAllocationSchema],
  
  // Performance (ACTUAL)
  actualPerformance: ActualPerformanceSchema,
  
  // Additional Details
  benchmark: String,
  riskLevel: {
    type: String,
    enum: ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']
  },
  fundObjective: String,
  investmentStrategy: String,
  
  // Data Quality
  dataSource: {
    type: String,
    enum: ['MANUAL_ENTRY', 'VERIFIED_API', 'FUND_HOUSE_OFFICIAL'],
    required: true,
    default: 'MANUAL_ENTRY'
  },
  dataQuality: {
    type: String,
    enum: ['VERIFIED', 'PENDING_VERIFICATION', 'EXCELLENT', 'GOOD'],
    required: true,
    default: 'PENDING_VERIFICATION',
    index: true
  },
  
  // Tracking
  enteredBy: {
    type: String,
    required: true,
    index: true
  },
  verifiedBy: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastVerified: Date,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Source Information
  sourceUrl: String,
  factsheetDate: Date,
  dataEntryNotes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
ActualMutualFundDetailsSchema.index({ schemeCode: 1, isActive: 1 });
ActualMutualFundDetailsSchema.index({ fundHouse: 1, dataQuality: 1 });
ActualMutualFundDetailsSchema.index({ dataQuality: 1, lastUpdated: -1 });
ActualMutualFundDetailsSchema.index({ enteredBy: 1, lastUpdated: -1 });
ActualMutualFundDetailsSchema.index({ schemeName: 'text', fundHouse: 'text' });

// Compound index for admin dashboard queries
ActualMutualFundDetailsSchema.index({ 
  isActive: 1, 
  dataQuality: 1, 
  lastUpdated: -1 
});

export default mongoose.models.ActualMutualFundDetails || 
  mongoose.model<IActualMutualFundDetails>('ActualMutualFundDetails', ActualMutualFundDetailsSchema);