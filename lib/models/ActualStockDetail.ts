import mongoose, { Schema, Document } from 'mongoose';

// Interface for yearly financial data
interface YearlyData {
  year: string; // e.g., "Mar-24", "Mar-25"
  value: number;
}

// Interface for quarterly data
interface QuarterlyData {
  quarter: string; // e.g., "Mar-23", "Jun-23", "Sep-23", "Dec-23"
  value: number;
}

export interface IActualStockDetail extends Document {
  symbol: string;
  companyName: string;

  // Meta information
  meta: {
    faceValue: number;
    currentPrice: number;
    marketCapitalization: number;
    numberOfShares?: number;
  };

  // Profit & Loss data (yearly) - Complete data from Data Sheet
  profitAndLoss: {
    sales: YearlyData[];
    rawMaterialCost: YearlyData[];
    changeInInventory: YearlyData[];
    powerAndFuel: YearlyData[];
    otherMfrExp: YearlyData[];
    employeeCost: YearlyData[];
    sellingAndAdmin: YearlyData[];
    otherExpenses: YearlyData[];
    otherIncome: YearlyData[];
    depreciation: YearlyData[];
    interest: YearlyData[];
    profitBeforeTax: YearlyData[];
    tax: YearlyData[];
    netProfit: YearlyData[];
    dividendAmount: YearlyData[];
  };

  // Quarterly data - Complete quarterly information
  quarterlyData: {
    sales: QuarterlyData[];
    expenses: QuarterlyData[];
    otherIncome: QuarterlyData[];
    depreciation: QuarterlyData[];
    interest: QuarterlyData[];
    profitBeforeTax: QuarterlyData[];
    tax: QuarterlyData[];
    netProfit: QuarterlyData[];
    operatingProfit: QuarterlyData[];
  };

  // Balance Sheet data (yearly) - Complete balance sheet information
  balanceSheet: {
    equityShareCapital: YearlyData[];
    reserves: YearlyData[];
    borrowings: YearlyData[];
    otherLiabilities: YearlyData[];
    total: YearlyData[];
    netBlock: YearlyData[];
    capitalWorkInProgress: YearlyData[];
    investments: YearlyData[];
    otherAssets: YearlyData[];
    receivables: YearlyData[];
    inventory: YearlyData[];
    cashAndBank: YearlyData[];
    numberOfEquityShares: YearlyData[];
    newBonusShares: YearlyData[];
    faceValue: YearlyData[];
    adjustedEquityShares: YearlyData[];
  };

  // Cash Flow data (yearly)
  cashFlow: {
    cashFromOperatingActivity: YearlyData[];
    cashFromInvestingActivity: YearlyData[];
    cashFromFinancingActivity: YearlyData[];
    netCashFlow: YearlyData[];
  };

  // Price data
  priceData: YearlyData[];

  // Raw sheet data from Excel
  sheetData?: {
    sheetName: string;
    headers: string[];
    rows: any[][];
    range: string;
    totalRows: number;
  }[];

  // Additional information that can be manually filled
  additionalInfo: {
    description?: string;
    website?: string;
    sector?: string;
    industry?: string;
    managementTeam?: string[];
    niftyIndex?: 'NIFTY_50' | 'NIFTY_100' | 'NIFTY_200' | 'NIFTY_500' | 'NOT_LISTED';
    niftyIndices?: ('NIFTY_50' | 'NIFTY_100' | 'NIFTY_200' | 'NIFTY_500' | 'NIFTY_NEXT_50' | 'NIFTY_BANK' | 'NIFTY_FINANCIAL_SERVICES' | 'NIFTY_MIDCAP_SELECT' | 'NIFTY_MIDCAP_50' | 'NIFTY_MIDCAP_100' | 'NIFTY_MIDCAP_150' | 'NIFTY_SMALLCAP_50' | 'NIFTY_SMALLCAP_100' | 'NIFTY_SMALLCAP_250' | 'NIFTY_AUTO' | 'NIFTY_FINANCIAL_SERVICES_25_50' | 'NIFTY_FMCG' | 'NIFTY_IT' | 'NIFTY_MEDIA' | 'NIFTY_METAL' | 'NIFTY_PHARMA' | 'NIFTY_PSU_BANK' | 'NIFTY_REALTY' | 'NIFTY_PRIVATE_BANK' | 'NIFTY_HEALTHCARE_INDEX' | 'NIFTY_CONSUMER_DURABLES' | 'NIFTY_OIL_GAS' | 'NIFTY_MIDSMALL_HEALTHCARE' | 'NIFTY_FINANCIAL_SERVICES_EX_BANK' | 'NIFTY_MIDSMALL_FINANCIAL_SERVICES' | 'NIFTY_MIDSMALL_IT_TELECOM')[];
  };

  // Stock ratios and financial metrics
  ratios?: {
    [key: string]: number | string;
  };

  // Metadata
  dataQuality: 'PENDING_VERIFICATION' | 'VERIFIED' | 'EXCELLENT' | 'GOOD';
  enteredBy: string;
  uploadedFiles?: {
    fileName: string;
    fileType: 'excel' | 'pdf' | 'csv';
    fileSize: number;
    uploadDate: Date;
    filePath?: string;
  }[];
  isActive: boolean;
  lastUpdated: Date;
}

const YearlyDataSchema = new Schema({
  year: { type: String, required: true },
  value: { type: Number, required: true }
}, { _id: false });

const QuarterlyDataSchema = new Schema({
  quarter: { type: String, required: true },
  value: { type: Number, required: true }
}, { _id: false });

const UploadedFileSchema = new Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ['excel', 'pdf', 'csv'], required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  filePath: { type: String }
}, { _id: false });

const ActualStockDetailSchema: Schema = new Schema({
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

  // Meta information
  meta: {
    faceValue: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    marketCapitalization: { type: Number, required: true },
    numberOfShares: { type: Number }
  },

  // Profit & Loss data (yearly)
  profitAndLoss: {
    sales: [YearlyDataSchema],
    rawMaterialCost: [YearlyDataSchema],
    changeInInventory: [YearlyDataSchema],
    powerAndFuel: [YearlyDataSchema],
    otherMfrExp: [YearlyDataSchema],
    employeeCost: [YearlyDataSchema],
    sellingAndAdmin: [YearlyDataSchema],
    otherExpenses: [YearlyDataSchema],
    otherIncome: [YearlyDataSchema],
    depreciation: [YearlyDataSchema],
    interest: [YearlyDataSchema],
    profitBeforeTax: [YearlyDataSchema],
    tax: [YearlyDataSchema],
    netProfit: [YearlyDataSchema],
    dividendAmount: [YearlyDataSchema]
  },

  // Quarterly data
  quarterlyData: {
    sales: [QuarterlyDataSchema],
    expenses: [QuarterlyDataSchema],
    otherIncome: [QuarterlyDataSchema],
    depreciation: [QuarterlyDataSchema],
    interest: [QuarterlyDataSchema],
    profitBeforeTax: [QuarterlyDataSchema],
    tax: [QuarterlyDataSchema],
    netProfit: [QuarterlyDataSchema],
    operatingProfit: [QuarterlyDataSchema]
  },

  // Balance Sheet data (yearly)
  balanceSheet: {
    equityShareCapital: [YearlyDataSchema],
    reserves: [YearlyDataSchema],
    borrowings: [YearlyDataSchema],
    otherLiabilities: [YearlyDataSchema],
    total: [YearlyDataSchema],
    netBlock: [YearlyDataSchema],
    capitalWorkInProgress: [YearlyDataSchema],
    investments: [YearlyDataSchema],
    otherAssets: [YearlyDataSchema],
    receivables: [YearlyDataSchema],
    inventory: [YearlyDataSchema],
    cashAndBank: [YearlyDataSchema],
    numberOfEquityShares: [YearlyDataSchema],
    newBonusShares: [YearlyDataSchema],
    faceValue: [YearlyDataSchema],
    adjustedEquityShares: [YearlyDataSchema]
  },

  // Cash Flow data (yearly)
  cashFlow: {
    cashFromOperatingActivity: [YearlyDataSchema],
    cashFromInvestingActivity: [YearlyDataSchema],
    cashFromFinancingActivity: [YearlyDataSchema],
    netCashFlow: [YearlyDataSchema]
  },

  // Price data
  priceData: [YearlyDataSchema],

  // Raw sheet data from Excel
  sheetData: [{
    sheetName: { type: String, required: true },
    headers: [{ type: String }],
    rows: [{ type: Schema.Types.Mixed }],
    range: { type: String },
    totalRows: { type: Number }
  }],

  // Additional information that can be manually filled
  additionalInfo: {
    description: { type: String },
    website: { type: String },
    sector: { type: String, index: true },
    industry: { type: String, index: true },
    managementTeam: [{ type: String }],
    niftyIndex: {
      type: String,
      enum: ['NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500', 'NOT_LISTED'],
      index: true
    },
    niftyIndices: [{
      type: String,
      enum: [
        'NIFTY_50', 'NIFTY_100', 'NIFTY_200', 'NIFTY_500', 'NIFTY_NEXT_50',
        'NIFTY_BANK', 'NIFTY_FINANCIAL_SERVICES',
        'NIFTY_MIDCAP_SELECT', 'NIFTY_MIDCAP_50', 'NIFTY_MIDCAP_100', 'NIFTY_MIDCAP_150',
        'NIFTY_SMALLCAP_50', 'NIFTY_SMALLCAP_100', 'NIFTY_SMALLCAP_250',
        'NIFTY_AUTO', 'NIFTY_FINANCIAL_SERVICES_25_50', 'NIFTY_FMCG', 'NIFTY_IT',
        'NIFTY_MEDIA', 'NIFTY_METAL', 'NIFTY_PHARMA', 'NIFTY_PSU_BANK',
        'NIFTY_REALTY', 'NIFTY_PRIVATE_BANK', 'NIFTY_HEALTHCARE_INDEX',
        'NIFTY_CONSUMER_DURABLES', 'NIFTY_OIL_GAS', 'NIFTY_MIDSMALL_HEALTHCARE',
        'NIFTY_FINANCIAL_SERVICES_EX_BANK', 'NIFTY_MIDSMALL_FINANCIAL_SERVICES',
        'NIFTY_MIDSMALL_IT_TELECOM'
      ],
      index: true
    }]
  },

  // Stock ratios and financial metrics
  ratios: {
    type: Schema.Types.Mixed,
    default: undefined
  },

  // Metadata
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
  uploadedFiles: [UploadedFileSchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance
ActualStockDetailSchema.index({ symbol: 1, isActive: 1 });
ActualStockDetailSchema.index({ 'additionalInfo.sector': 1, isActive: 1 });
ActualStockDetailSchema.index({ 'additionalInfo.industry': 1, isActive: 1 });
ActualStockDetailSchema.index({ dataQuality: 1, isActive: 1 });
ActualStockDetailSchema.index({ 'meta.marketCapitalization': -1 });
ActualStockDetailSchema.index({ lastUpdated: -1 });

// Text search index for symbols and company names
ActualStockDetailSchema.index({
  symbol: 'text',
  companyName: 'text',
  'additionalInfo.description': 'text'
});

export default mongoose.models.ActualStockDetail ||
  mongoose.model<IActualStockDetail>('ActualStockDetail', ActualStockDetailSchema);