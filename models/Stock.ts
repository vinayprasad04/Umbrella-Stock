import mongoose, { Schema, model, models } from 'mongoose';
import { Stock } from '@/types';

const StockSchema = new Schema<Stock>({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sector: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  change: {
    type: Number,
    required: true,
  },
  changePercent: {
    type: Number,
    required: true,
  },
  volume: {
    type: Number,
    required: true,
    min: 0,
  },
  marketCap: {
    type: Number,
    min: 0,
  },
  pe: {
    type: Number,
    min: 0,
  },
  eps: {
    type: Number,
  },
  dividend: {
    type: Number,
    min: 0,
  },
  high52Week: {
    type: Number,
    min: 0,
  },
  low52Week: {
    type: Number,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

StockSchema.index({ symbol: 1 });
StockSchema.index({ sector: 1 });
StockSchema.index({ changePercent: -1 });

export default models.Stock || model<Stock>('Stock', StockSchema);