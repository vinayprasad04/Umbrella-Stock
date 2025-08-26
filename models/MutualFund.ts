import mongoose, { Schema, model, models } from 'mongoose';
import { MutualFund } from '@/types';

const MutualFundSchema = new Schema<MutualFund>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  nav: {
    type: Number,
    required: true,
    min: 0,
  },
  returns1Y: {
    type: Number,
    required: true,
  },
  returns3Y: {
    type: Number,
    required: true,
  },
  returns5Y: {
    type: Number,
    required: true,
  },
  expenseRatio: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  aum: {
    type: Number,
    required: true,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

MutualFundSchema.index({ category: 1 });
MutualFundSchema.index({ returns1Y: -1 });

export default models.MutualFund || model<MutualFund>('MutualFund', MutualFundSchema);