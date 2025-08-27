export interface NiftyStock {
  symbol: string;
  name: string;
  yahooSymbol: string;
  sector?: string;
}

export const NIFTY_50_STOCKS: NiftyStock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", yahooSymbol: "RELIANCE.NS", sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", yahooSymbol: "TCS.NS", sector: "IT" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", yahooSymbol: "HDFCBANK.NS", sector: "Banking" },
  { symbol: "INFY", name: "Infosys Ltd", yahooSymbol: "INFY.NS", sector: "IT" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", yahooSymbol: "HINDUNILVR.NS", sector: "FMCG" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", yahooSymbol: "ICICIBANK.NS", sector: "Banking" },
  { symbol: "SBIN", name: "State Bank of India", yahooSymbol: "SBIN.NS", sector: "Banking" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", yahooSymbol: "BHARTIARTL.NS", sector: "Telecom" },
  { symbol: "ITC", name: "ITC Ltd", yahooSymbol: "ITC.NS", sector: "FMCG" },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd", yahooSymbol: "HCLTECH.NS", sector: "IT" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", yahooSymbol: "KOTAKBANK.NS", sector: "Banking" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", yahooSymbol: "LT.NS", sector: "Engineering" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", yahooSymbol: "ASIANPAINT.NS", sector: "Paints" },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", yahooSymbol: "AXISBANK.NS", sector: "Banking" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", yahooSymbol: "MARUTI.NS", sector: "Auto" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd", yahooSymbol: "SUNPHARMA.NS", sector: "Pharma" },
  { symbol: "TITAN", name: "Titan Company Ltd", yahooSymbol: "TITAN.NS", sector: "Consumer Goods" },
  { symbol: "NTPC", name: "NTPC Ltd", yahooSymbol: "NTPC.NS", sector: "Power" },
  { symbol: "NESTLEIND", name: "Nestle India Ltd", yahooSymbol: "NESTLEIND.NS", sector: "FMCG" },
  { symbol: "WIPRO", name: "Wipro Ltd", yahooSymbol: "WIPRO.NS", sector: "IT" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd", yahooSymbol: "ULTRACEMCO.NS", sector: "Cement" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", yahooSymbol: "BAJFINANCE.NS", sector: "NBFC" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd", yahooSymbol: "POWERGRID.NS", sector: "Power" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corporation Ltd", yahooSymbol: "ONGC.NS", sector: "Energy" },
  { symbol: "M&M", name: "Mahindra & Mahindra Ltd", yahooSymbol: "M&M.NS", sector: "Auto" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", yahooSymbol: "TATAMOTORS.NS", sector: "Auto" },
  { symbol: "TECHM", name: "Tech Mahindra Ltd", yahooSymbol: "TECHM.NS", sector: "IT" },
  { symbol: "COALINDIA", name: "Coal India Ltd", yahooSymbol: "COALINDIA.NS", sector: "Mining" },
  { symbol: "JSWSTEEL", name: "JSW Steel Ltd", yahooSymbol: "JSWSTEEL.NS", sector: "Steel" },
  { symbol: "TATASTEEL", name: "Tata Steel Ltd", yahooSymbol: "TATASTEEL.NS", sector: "Steel" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd", yahooSymbol: "BAJAJFINSV.NS", sector: "NBFC" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd", yahooSymbol: "DRREDDY.NS", sector: "Pharma" },
  { symbol: "GRASIM", name: "Grasim Industries Ltd", yahooSymbol: "GRASIM.NS", sector: "Chemicals" },
  { symbol: "HINDPETRO", name: "Hindustan Petroleum Corporation Ltd", yahooSymbol: "HINDPETRO.NS", sector: "Energy" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Ltd", yahooSymbol: "INDUSINDBK.NS", sector: "Banking" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Ltd", yahooSymbol: "DIVISLAB.NS", sector: "Pharma" },
  { symbol: "BRITANNIA", name: "Britannia Industries Ltd", yahooSymbol: "BRITANNIA.NS", sector: "FMCG" },
  { symbol: "CIPLA", name: "Cipla Ltd", yahooSymbol: "CIPLA.NS", sector: "Pharma" },
  { symbol: "EICHERMOT", name: "Eicher Motors Ltd", yahooSymbol: "EICHERMOT.NS", sector: "Auto" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd", yahooSymbol: "HEROMOTOCO.NS", sector: "Auto" },
  { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone Ltd", yahooSymbol: "ADANIPORTS.NS", sector: "Infrastructure" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise Ltd", yahooSymbol: "APOLLOHOSP.NS", sector: "Healthcare" },
  { symbol: "BPCL", name: "Bharat Petroleum Corporation Ltd", yahooSymbol: "BPCL.NS", sector: "Energy" },
  { symbol: "SHREECEM", name: "Shree Cement Ltd", yahooSymbol: "SHREECEM.NS", sector: "Cement" },
  { symbol: "HINDALCO", name: "Hindalco Industries Ltd", yahooSymbol: "HINDALCO.NS", sector: "Metals" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd", yahooSymbol: "TATACONSUM.NS", sector: "FMCG" },
  { symbol: "UPL", name: "UPL Ltd", yahooSymbol: "UPL.NS", sector: "Chemicals" },
  { symbol: "SBILIFE", name: "SBI Life Insurance Company Ltd", yahooSymbol: "SBILIFE.NS", sector: "Insurance" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance Company Ltd", yahooSymbol: "HDFCLIFE.NS", sector: "Insurance" },
  { symbol: "LTIM", name: "LTIMindtree Ltd", yahooSymbol: "LTIM.NS", sector: "IT" }
];

export const getAllNifty50Symbols = (): string[] => {
  return NIFTY_50_STOCKS.map(stock => stock.yahooSymbol);
};

export const getAllNifty50SymbolsString = (): string => {
  return getAllNifty50Symbols().join(',');
};

export const getNifty50StockBySymbol = (symbol: string): NiftyStock | undefined => {
  return NIFTY_50_STOCKS.find(stock => 
    stock.symbol === symbol || stock.yahooSymbol === symbol
  );
};

export const getNifty50StocksBySector = (sector: string): NiftyStock[] => {
  return NIFTY_50_STOCKS.filter(stock => stock.sector === sector);
};

export const getAllSectors = (): string[] => {
  const sectors = NIFTY_50_STOCKS
    .map(stock => stock.sector)
    .filter((sector): sector is string => sector !== undefined);
  return [...new Set(sectors)];
};