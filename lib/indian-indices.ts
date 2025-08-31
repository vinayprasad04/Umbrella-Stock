export interface IndianIndex {
  symbol: string;
  name: string;
  description: string;
  category: string;
  color: string;
}

export const INDIAN_INDICES: IndianIndex[] = [
  {
    symbol: "^NSEI",
    name: "NIFTY 50",
    description: "Top 50 companies by market capitalization",
    category: "Broad Market",
    color: "blue"
  },
  {
    symbol: "^CNX100",
    name: "NIFTY 100", 
    description: "Top 100 companies representing liquid stocks",
    category: "Broad Market",
    color: "indigo"
  },
  {
    symbol: "^NSEBANK",
    name: "NIFTY Bank",
    description: "Banking sector index with major banks",
    category: "Sectoral",
    color: "green"
  },
  {
    symbol: "^CNXIT",
    name: "NIFTY IT",
    description: "Information Technology sector companies",
    category: "Sectoral", 
    color: "purple"
  },
  {
    symbol: "^CNXPHARMA",
    name: "NIFTY Pharma",
    description: "Pharmaceutical and healthcare companies",
    category: "Sectoral",
    color: "red"
  },
  {
    symbol: "^NSEMDCP100",
    name: "NIFTY Midcap 100",
    description: "Mid-cap companies with good liquidity",
    category: "Market Cap",
    color: "orange"
  },
  {
    symbol: "^CNXSC",
    name: "NIFTY Smallcap 100", 
    description: "Small-cap companies for growth opportunities",
    category: "Market Cap",
    color: "pink"
  },
  {
    symbol: "GOLDM.NS",
    name: "Gold Futures",
    description: "Gold commodity futures trading",
    category: "Commodity",
    color: "yellow"
  },
  {
    symbol: "USDINR=X",
    name: "USD/INR",
    description: "US Dollar to Indian Rupee exchange rate",
    category: "Currency",
    color: "cyan"
  }
];

export const getAllIndexSymbols = (): string[] => {
  return INDIAN_INDICES.map(index => index.symbol);
};

export const getAllIndexSymbolsString = (): string => {
  return getAllIndexSymbols().join(',');
};

export const getIndexBySymbol = (symbol: string): IndianIndex | undefined => {
  return INDIAN_INDICES.find(index => index.symbol === symbol);
};

export const getIndicesByCategory = (category: string): IndianIndex[] => {
  return INDIAN_INDICES.filter(index => index.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = INDIAN_INDICES.map(index => index.category);
  return Array.from(new Set(categories));
};

export const getBroadMarketIndices = (): IndianIndex[] => {
  return getIndicesByCategory('Broad Market');
};

export const getSectoralIndices = (): IndianIndex[] => {
  return getIndicesByCategory('Sectoral');
};

export const getMarketCapIndices = (): IndianIndex[] => {
  return getIndicesByCategory('Market Cap');
};

export const getCommodityIndices = (): IndianIndex[] => {
  return getIndicesByCategory('Commodity');
};

export const getCurrencyIndices = (): IndianIndex[] => {
  return getIndicesByCategory('Currency');
};