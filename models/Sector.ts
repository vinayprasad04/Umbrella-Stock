import mongoose, { Schema, model, models } from 'mongoose';
import { Sector } from '@/types';

const SectorSchema = new Schema<Sector>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  performance: {
    type: Number,
    required: true,
  },
  stockCount: {
    type: Number,
    required: true,
    min: 0,
  },
  topStocks: [{
    type: String,
    uppercase: true,
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

SectorSchema.index({ performance: -1 });

export default models.Sector || model<Sector>('Sector', SectorSchema);