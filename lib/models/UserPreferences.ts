import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: string;
  email: string;
  watchlistOrder: string[]; // Array of symbols in order
  watchlistNames: { [key: string]: string }; // Custom names for watchlist tabs (string keys)
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  watchlistOrder: {
    type: [String],
    default: []
  },
  watchlistNames: {
    type: Map,
    of: String,
    default: new Map([
      ['1', 'Watchlist 1'],
      ['2', 'Watchlist 2'],
      ['3', 'Watchlist 3'],
      ['4', 'Watchlist 4'],
      ['5', 'Watchlist 5']
    ])
  }
}, {
  timestamps: true
});

export default mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);