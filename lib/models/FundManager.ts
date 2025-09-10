import mongoose from 'mongoose';

export interface IFundManager {
  _id?: string;
  name: string;
  experience: string;
  education: string;
  fundsManaged: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  lastUpdatedBy?: string;
}

const FundManagerSchema = new mongoose.Schema<IFundManager>({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  education: {
    type: String,
    required: true,
    trim: true
  },
  fundsManaged: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    trim: true
  },
  lastUpdatedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
FundManagerSchema.index({ name: 1, isActive: 1 });
FundManagerSchema.index({ createdAt: -1 });

// Ensure unique name for active fund managers
FundManagerSchema.index(
  { name: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

const FundManager = mongoose.models.FundManager || mongoose.model<IFundManager>('FundManager', FundManagerSchema);

export default FundManager;