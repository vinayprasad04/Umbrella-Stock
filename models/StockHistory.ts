import mongoose, { Schema, model, models } from 'mongoose';
import { StockHistory } from '@/types';

const StockHistorySchema = new Schema<StockHistory>({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  open: {
    type: Number,
    required: true,
    min: 0,
  },
  high: {
    type: Number,
    required: true,
    min: 0,
  },
  low: {
    type: Number,
    required: true,
    min: 0,
  },
  close: {
    type: Number,
    required: true,
    min: 0,
  },
  volume: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
});

StockHistorySchema.index({ symbol: 1, date: -1 });
StockHistorySchema.index({ date: -1 });

export default models.StockHistory || model<StockHistory>('StockHistory', StockHistorySchema);