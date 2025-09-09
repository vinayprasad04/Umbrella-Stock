import mongoose, { Schema, Document } from 'mongoose';

// Interface for actual fund manager details
export interface IActualFundManager {
  name: string;
  since?: string;
  experience?: string;
  education?: string;
  fundsManaged?: string[];
}

// Interface for sector wise holdings
export interface ISectorWiseHolding {
  sector: string;
  fundPercentage: number;
  categoryPercentage: number;
}

// Interface for top equity holdings
export interface ITopEquityHolding {
  companyName: string;
  sector: string;
  peRatio: number;
  assetsPercentage: number;
}

// Interface for top debt holdings
export interface ITopDebtHolding {
  companyName: string;
  instrument: string;
  creditRating: string;
  assetsPercentage: number;
}

// Interface for asset allocation
export interface IAssetAllocation {
  equity: number;
  debt: number;
  cashAndCashEq: number;
}

// Interface for portfolio aggregates
export interface IPortfolioAggregates {
  giant: number;
  large: number;
  mid: number;
  small: number;
  tiny: number;
  avgMarketCap: number;
}

// Interface for credit rating
export interface ICreditRating {
  aaa: number;
  sov: number;
  cashEquivalent: number;
  aa: number;
}

// Interface for fund info
export interface IFundInfo {
  nameOfAMC: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
}

// Interface for complete ACTUAL fund details
export interface IActualMutualFundDetails extends Document {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  
  // Asset Allocation
  assetAllocation: IAssetAllocation;
  
  // Portfolio Aggregates
  portfolioAggregates: IPortfolioAggregates;
  
  // Credit Rating
  creditRating: ICreditRating;
  
  // Holdings and Sectors
  sectorWiseHoldings: ISectorWiseHolding[];
  topEquityHoldings: ITopEquityHolding[];
  topDebtHoldings: ITopDebtHolding[];
  
  // Fund Details
  launchDate?: string;
  riskometer?: string;
  expense?: number;
  exitLoad?: string;
  openEnded?: boolean;
  lockInPeriod?: string;
  
  // Fund Information
  fundInfo: IFundInfo;
  
  // Fund Managers
  actualFundManagers: IActualFundManager[];
  
  // Data Quality & Source
  dataSource: string;
  dataQuality: 'VERIFIED' | 'PENDING_VERIFICATION' | 'EXCELLENT' | 'GOOD';
  notes?: string;
  
  // Tracking Information
  enteredBy: string;
  verifiedBy?: string;
  lastUpdated: Date;
  lastVerified?: Date;
  isActive: boolean;
  
  // Source Information
  sourceUrl?: string;
  factsheetDate?: Date;
  dataEntryNotes?: string;
}

// Schema definitions
const ActualFundManagerSchema = new Schema({
  name: { type: String, required: true },
  since: String,
  experience: String,
  education: String,
  fundsManaged: [String]
});

const SectorWiseHoldingSchema = new Schema({
  sector: { type: String, required: true },
  fundPercentage: { type: Number, required: true, min: 0, max: 100 },
  categoryPercentage: { type: Number, required: true, min: 0, max: 100, default: 0 }
});

const TopEquityHoldingSchema = new Schema({
  companyName: { type: String, required: true },
  sector: { type: String, required: true },
  peRatio: { type: Number, required: true, default: 0 },
  assetsPercentage: { type: Number, required: true, min: 0, max: 100 }
});

const TopDebtHoldingSchema = new Schema({
  companyName: { type: String, required: true },
  instrument: { type: String, required: true },
  creditRating: { type: String, required: true },
  assetsPercentage: { type: Number, required: true, min: 0, max: 100 }
});

const AssetAllocationSchema = new Schema({
  equity: { type: Number, required: true, min: 0, max: 100, default: 0 },
  debt: { type: Number, required: true, min: 0, max: 100, default: 0 },
  cashAndCashEq: { type: Number, required: true, min: 0, max: 100, default: 0 }
});

const PortfolioAggregatesSchema = new Schema({
  giant: { type: Number, required: true, min: 0, max: 100, default: 0 },
  large: { type: Number, required: true, min: 0, max: 100, default: 0 },
  mid: { type: Number, required: true, min: 0, max: 100, default: 0 },
  small: { type: Number, required: true, min: 0, max: 100, default: 0 },
  tiny: { type: Number, required: true, min: 0, max: 100, default: 0 },
  avgMarketCap: { type: Number, required: true, default: 0 }
});

const CreditRatingSchema = new Schema({
  aaa: { type: Number, required: true, min: 0, max: 100, default: 0 },
  sov: { type: Number, required: true, min: 0, max: 100, default: 0 },
  cashEquivalent: { type: Number, required: true, min: 0, max: 100, default: 0 },
  aa: { type: Number, required: true, min: 0, max: 100, default: 0 }
});

const FundInfoSchema = new Schema({
  nameOfAMC: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  fax: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' }
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
  
  // Asset Allocation
  assetAllocation: {
    type: AssetAllocationSchema,
    required: true,
    default: () => ({ equity: 0, debt: 0, cashAndCashEq: 0 })
  },
  
  // Portfolio Aggregates
  portfolioAggregates: {
    type: PortfolioAggregatesSchema,
    required: true,
    default: () => ({ giant: 0, large: 0, mid: 0, small: 0, tiny: 0, avgMarketCap: 0 })
  },
  
  // Credit Rating
  creditRating: {
    type: CreditRatingSchema,
    required: true,
    default: () => ({ aaa: 0, sov: 0, cashEquivalent: 0, aa: 0 })
  },
  
  // Holdings and Sectors
  sectorWiseHoldings: {
    type: [SectorWiseHoldingSchema],
    default: []
  },
  topEquityHoldings: {
    type: [TopEquityHoldingSchema],
    default: []
  },
  topDebtHoldings: {
    type: [TopDebtHoldingSchema],
    default: []
  },
  
  // Fund Details
  launchDate: String,
  riskometer: {
    type: String,
    enum: ['Low', 'Low to Moderate', 'Moderate', 'Moderately High', 'High', 'Very High', 'Not Selected'],
    default: 'Not Selected'
  },
  expense: { type: Number, min: 0 },
  exitLoad: String,
  openEnded: { type: Boolean, default: true },
  lockInPeriod: { type: String, default: 'N/A' },
  
  // Fund Information
  fundInfo: {
    type: FundInfoSchema,
    required: true,
    default: () => ({ nameOfAMC: '', address: '', phone: '', fax: '', email: '', website: '' })
  },
  
  // Fund Managers
  actualFundManagers: {
    type: [ActualFundManagerSchema],
    required: true,
    default: []
  },
  
  // Data Quality & Source
  dataSource: {
    type: String,
    enum: [
      'MANUAL_ENTRY',
      'VERIFIED_API', 
      'FUND_HOUSE_OFFICIAL',
      'Value Research',
      'Morningstar',
      'Official Fund Factsheet',
      'AMC Website',
      'Moneycontrol',
      'Economic Times',
      'Other'
    ],
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
  notes: String,
  
  // Tracking Information
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

// Clear any cached model to ensure schema changes take effect
if (mongoose.models.ActualMutualFundDetails) {
  delete mongoose.models.ActualMutualFundDetails;
}

export default mongoose.model<IActualMutualFundDetails>('ActualMutualFundDetails', ActualMutualFundDetailsSchema);