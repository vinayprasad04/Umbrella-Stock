// Extended Nifty indices data for comprehensive stock classification
export interface NiftyStockInfo {
  symbol: string;
  name: string;
  sector?: string;
  indices: string[]; // Can be member of multiple indices
}

// Nifty 50 stocks (already have this data)
export const NIFTY_50_SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK", "SBIN",
  "BHARTIARTL", "ITC", "HCLTECH", "KOTAKBANK", "LT", "ASIANPAINT", "AXISBANK",
  "MARUTI", "SUNPHARMA", "TITAN", "NTPC", "NESTLEIND", "WIPRO", "ULTRACEMCO",
  "BAJFINANCE", "POWERGRID", "ONGC", "M&M", "TATAMOTORS", "TECHM", "COALINDIA",
  "JSWSTEEL", "TATASTEEL", "BAJAJFINSV", "DRREDDY", "GRASIM", "HINDPETRO",
  "INDUSINDBK", "DIVISLAB", "BRITANNIA", "CIPLA", "EICHERMOT", "HEROMOTOCO",
  "ADANIPORTS", "APOLLOHOSP", "BPCL", "SHREECEM", "HINDALCO", "TATACONSUM",
  "UPL", "SBILIFE", "HDFCLIFE", "LTIM"
];

// Additional Nifty 100 stocks (excluding Nifty 50)
export const NIFTY_100_ADDITIONAL_SYMBOLS = [
  "ADANIENT", "GODREJCP", "DABUR", "BAJAJ-AUTO", "BERGEPAINT", "GLAND",
  "HAVELLS", "MARICO", "MOTHERSON", "PAGEIND", "PIDILITE", "SIEMENS",
  "VOLTAS", "AMBUJACEM", "BANDHANBNK", "BANKBARODA", "CANBK", "FEDERALBNK",
  "IDFCFIRSTB", "IOC", "PEL", "PNB", "RECLTD", "SAIL", "VEDL", "ZEEL",
  "AUBANK", "CHOLAFIN", "COLPAL", "CONCOR", "DLF", "GAIL", "GODREJPROP",
  "HDFCAMC", "ICICIPRULI", "LICHSGFIN", "LUPIN", "MCDOWELL-N", "MPHASIS",
  "NAUKRI", "NMDC", "OBEROIRLTY", "OFSS", "PETRONET", "PGHH", "PIIND",
  "PVR", "SRF", "TORNTPHARM", "TVSMOTOR"
];

// Sample of additional Nifty 500 stocks (this would be a much larger list in practice)
export const NIFTY_500_ADDITIONAL_SYMBOLS = [
  "AARTIIND", "ABB", "ABBOTINDIA", "ABCAPITAL", "ABFRL", "ACC", "APLAPOLLO",
  "AUROBINDO", "BALKRISIND", "BATAINDIA", "BEL", "BIOCON", "BOSCHLTD",
  "BSOFT", "CANBK", "CANFINHOME", "CHAMBLFERT", "COFORGE", "CROMPTON",
  "CUMMINSIND", "DELTACORP", "ESCORTS", "EXIDEIND", "FINEORG", "FLUOROCHEM",
  "GILLETTE", "GMRINFRA", "GPPL", "GRANULES", "HATHWAY", "HINDCOPPER",
  "HINDPETRO", "HONAUT", "IDEA", "IPCALAB", "IRCTC", "JBCHEPHARM", "JUBLFOOD",
  "KPITTECH", "LALPATHLAB", "LAURUSLABS", "MANAPPURAM", "MINDTREE", "MRPL",
  "NATIONALUM", "NAVINFLUOR", "NESTLEIND", "NLCINDIA", "NOCIL", "NYKAA",
  "PFIZER", "POLYMED", "POLYCAB", "PVRINOX", "RADICO", "RAMCOCEM", "RELAXO",
  "SANOFI", "SCHAEFFLER", "SEQUENT", "SHANKARA", "STAR", "SUNDRMFAST",
  "SYMPHONY", "TATAELXSI", "TATAINVEST", "TEAMLEASE", "THYROCARE", "TIINDIA",
  "TRENT", "TRITURBINE", "TTKPRESTIG", "UJJIVAN", "VGUARD", "VINATIORGA",
  "WHIRLPOOL", "YESBANK", "ZENSARTECH"
];

export const getNiftyClassification = (symbol: string): string => {
  if (NIFTY_50_SYMBOLS.includes(symbol)) {
    return 'NIFTY_50';
  } else if (NIFTY_100_ADDITIONAL_SYMBOLS.includes(symbol)) {
    return 'NIFTY_100';
  } else if (NIFTY_500_ADDITIONAL_SYMBOLS.includes(symbol)) {
    return 'NIFTY_500';
  }
  return 'NOT_LISTED';
};

export const getAllNifty50Symbols = (): string[] => NIFTY_50_SYMBOLS;
export const getAllNifty100Symbols = (): string[] => [...NIFTY_50_SYMBOLS, ...NIFTY_100_ADDITIONAL_SYMBOLS];
export const getAllNifty500Symbols = (): string[] => [...NIFTY_50_SYMBOLS, ...NIFTY_100_ADDITIONAL_SYMBOLS, ...NIFTY_500_ADDITIONAL_SYMBOLS];

export const isNifty50Stock = (symbol: string): boolean => NIFTY_50_SYMBOLS.includes(symbol);
export const isNifty100Stock = (symbol: string): boolean => getAllNifty100Symbols().includes(symbol);
export const isNifty500Stock = (symbol: string): boolean => getAllNifty500Symbols().includes(symbol);