// Configuration file for stock automation
module.exports = {
  // URLs
  screenerBaseUrl: 'https://www.screener.in/company/',
  adminBaseUrl: 'http://localhost:3000/api/admin/stock-details/',

  // Authentication
  adminToken: process.env.ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJkOThkY2JiM2I3MjE3ZDYzNDcwMjEiLCJlbWFpbCI6InZpbmF5LnFzc0BnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU4OTg2MjcyLCJleHAiOjE3NTg5ODcxNzJ9.qy23SBuB2CEVGTd6z9h110_2DcnSH_uffy9suPqncZI',

  // Directories
  downloadPath: './downloads',

  // Timing
  delayBetweenStocks: 3000, // 3 seconds
  downloadTimeout: 30000,   // 30 seconds
  uploadTimeout: 60000,     // 60 seconds

  // Stock symbols to process
  stockSymbols: [
    'HDFCBANK',
    'RELIANCE',
    'TCS',
    'INFY',
    'ICICIBANK',
    'BHARTIARTL',
    'ITC',
    'SBIN',
    'LT',
    'KOTAKBANK',
    'HCLTECH',
    'ASIANPAINT',
    'MARUTI',
    'AXISBANK',
    'TITAN',
    'NESTLEIND',
    'ULTRACEMCO',
    'BAJFINANCE',
    'SUNPHARMA',
    'WIPRO'
    // Add more symbols as needed
  ],

  // Browser settings
  browserOptions: {
    headless: false, // Set to true for production
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 1366,
      height: 768
    }
  }
};