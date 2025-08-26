export interface Stock {
  _id?: string;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  dividend?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: Date;
}

export interface StockHistory {
  _id?: string;
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Sector {
  _id?: string;
  name: string;
  performance: number;
  stockCount: number;
  topStocks: string[];
  lastUpdated: Date;
}

export interface MutualFund {
  _id?: string;
  name: string;
  category: string;
  nav: number;
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  expenseRatio: number;
  aum: number;
  lastUpdated: Date;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  watchlist: string[];
  searchHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface MarketOverview {
  topGainers: Stock[];
  topLosers: Stock[];
  activeStocks: Stock[];
  sectors: Sector[];
}