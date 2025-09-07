#!/usr/bin/env node

/**
 * Daily Mutual Fund Data Sync Script
 * Fetches data from AMFI India portal and updates the database
 * 
 * URL Format: https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx?frmdt=DD-MMM-YYYY
 * Usage: npm run sync-mf-daily [YYYY-MM-DD]
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_CONNECTION_URI || 'mongodb+srv://root:12345678901@cluster0.mihlqek.mongodb.net/umbrella-stock?retryWrites=true&w=majority';
const AMFI_BASE_URL = 'https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx';

// MongoDB client
let mongoClient;
let db;

/**
 * Format date for AMFI API (DD-MMM-YYYY format)
 * Example: 05-Sep-2025
 */
function formatDateForAMFI(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Parse AMFI NAV data (semicolon-separated format)
 * Format: Scheme Code;Scheme Name;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Net Asset Value;Repurchase Price;Sale Price;Date
 */
function parseAMFIData(data) {
  const lines = data.split('\n').filter(line => line.trim());
  const funds = [];
  
  let currentSchemeType = '';
  let currentAMC = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and header line
    if (!trimmedLine || trimmedLine.includes('Scheme Code;Scheme Name')) {
      continue;
    }
    
    // Check if it's a scheme type header (contains "Open Ended Schemes", "Close Ended Schemes", etc.)
    if (trimmedLine.includes('Open Ended Schemes') || 
        trimmedLine.includes('Close Ended Schemes') ||
        trimmedLine.includes('Interval Fund Schemes')) {
      currentSchemeType = trimmedLine;
      console.log(`📂 Found scheme type: ${currentSchemeType}`);
      continue;
    }
    
    // Check if it's an AMC/Fund House name (no semicolons, not empty, reasonable length)
    if (!trimmedLine.includes(';') && trimmedLine.length > 3 && trimmedLine.length < 100) {
      // Skip common non-AMC lines
      if (!trimmedLine.toLowerCase().includes('scheme') && 
          !trimmedLine.toLowerCase().includes('fund house') &&
          !trimmedLine.toLowerCase().includes('nav') &&
          !trimmedLine.toLowerCase().includes('date')) {
        currentAMC = trimmedLine.replace(/\s+/g, ' ').trim();
        console.log(`🏢 Found AMC: ${currentAMC}`);
      }
      continue;
    }
    
    // Parse fund data (semicolon-separated)
    // Correct Format: Scheme Code;Scheme Name;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Net Asset Value;Repurchase Price;Sale Price;Date
    if (trimmedLine.includes(';')) {
      const parts = trimmedLine.split(';').map(p => p.trim());
      
      if (parts.length >= 8) {
        try {
          const schemeCode = parseInt(parts[0]);
          const schemeName = parts[1] || '';
          const isinGrowthOrDiv = parts[2] && parts[2] !== '-' && parts[2] !== '' ? parts[2] : null;
          const isinDivReinvestment = parts[3] && parts[3] !== '-' && parts[3] !== '' ? parts[3] : null;
          const nav = parts[4] && parts[4] !== '-' ? parseFloat(parts[4]) : null;
          const repurchasePrice = parts[5] && parts[5] !== '-' && parts[5] !== '' ? parseFloat(parts[5]) : null;
          const salePrice = parts[6] && parts[6] !== '-' && parts[6] !== '' ? parseFloat(parts[6]) : null;
          const navDate = parts[7] || null;
          
          // Validate essential fields
          if (isNaN(schemeCode) || schemeCode <= 0 || !schemeName || !nav || isNaN(nav) || nav <= 0) {
            if (funds.length < 10) { // Debug first few rejections
              console.warn(`⚠️ Rejecting fund: schemeCode=${parts[0]}, nav=${parts[4]}, schemeName='${parts[1] || 'EMPTY'}'`);
            }
            continue;
          }
          
          // Skip if no current AMC (shouldn't happen but safety check)
          if (!currentAMC) {
            console.warn(`⚠️ Skipping scheme ${schemeCode} - no AMC found`);
            continue;
          }
          
          const fund = {
            schemeCode: schemeCode,
            schemeName: schemeName,
            isinGrowth: isinGrowthOrDiv, // ISIN Div Payout/ISIN Growth field
            isinDiv: isinDivReinvestment, // ISIN Div Reinvestment field
            nav: nav,
            repurchasePrice: repurchasePrice,
            salePrice: salePrice,
            navDate: navDate,
            fundHouse: currentAMC,
            schemeType: currentSchemeType,
            category: extractCategory(schemeName),
            isActive: true,
            lastUpdated: new Date()
          };
          
          funds.push(fund);
          
        } catch (error) {
          console.warn(`⚠️ Error parsing line: ${trimmedLine}`, error.message);
        }
      }
    }
  }
  
  const fundHouseCount = Object.keys(funds.reduce((acc, fund) => {
    acc[fund.fundHouse] = true;
    return acc;
  }, {})).length;
  
  console.log(`✅ Parsed ${funds.length} funds from ${fundHouseCount} fund houses`);
  console.log(`📝 Sample funds:`, funds.slice(0, 3).map(f => `${f.schemeCode}: ${f.schemeName} (${f.fundHouse})`));
  
  if (funds.length < 5000) {
    console.warn(`⚠️ WARNING: Only ${funds.length} funds parsed, expected around 8000+`);
    console.log(`🔍 Debug info:`);
    console.log(`- Total input lines: ${lines.length}`);
    console.log(`- Fund house count: ${fundHouseCount}`);
    console.log(`- Last 3 funds:`, funds.slice(-3).map(f => `${f.schemeCode}: ${f.schemeName}`));
  }
  
  return funds;
}

/**
 * Extract category from scheme name
 */
function extractCategory(schemeName) {
  const name = schemeName.toLowerCase();
  
  if (name.includes('equity') || name.includes('growth')) return 'Equity';
  if (name.includes('debt') || name.includes('bond') || name.includes('income')) return 'Debt';
  if (name.includes('hybrid') || name.includes('balanced') || name.includes('conservative')) return 'Hybrid';
  if (name.includes('liquid') || name.includes('money market') || name.includes('overnight')) return 'Liquid';
  if (name.includes('elss') || name.includes('tax') || name.includes('equity linked')) return 'ELSS';
  if (name.includes('index') || name.includes('etf')) return 'Index';
  if (name.includes('gold') || name.includes('commodity') || name.includes('silver')) return 'Commodity';
  if (name.includes('international') || name.includes('overseas') || name.includes('global')) return 'International';
  if (name.includes('solution') || name.includes('fof') || name.includes('fund of funds')) return 'Solution Oriented';
  
  return 'Other';
}

/**
 * Connect to MongoDB
 */
async function connectToMongoDB() {
  console.log('🔌 Connecting to MongoDB...');
  
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db('umbrella-stock');
    console.log('✅ Connected to MongoDB successfully');
    
    // Ensure collection exists and has proper indexes
    const collection = db.collection('mutualfunds');
    
    // Create indexes if they don't exist
    try {
      await collection.createIndex({ schemeCode: 1 }, { unique: true, background: true });
      await collection.createIndex({ schemeName: 'text', fundHouse: 'text' }, { background: true });
      await collection.createIndex({ category: 1, isActive: 1 }, { background: true });
      console.log('✅ Ensured database indexes');
    } catch (error) {
      // Indexes might already exist, that's okay
      console.log('📝 Database indexes already exist');
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Fetch mutual fund data from AMFI portal
 */
async function fetchAMFIData(date) {
  try {
    const formattedDate = formatDateForAMFI(date);
    const url = `${AMFI_BASE_URL}?frmdt=${formattedDate}`;
    
    console.log(`📥 Fetching data from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 120000, // 2 minutes timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (response.status === 200 && response.data) {
      console.log(`✅ Data fetched successfully (${response.data.length} characters)`);
      return response.data;
    } else {
      throw new Error(`Invalid response: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error fetching AMFI data:', error.message);
    throw error;
  }
}

/**
 * Clear existing mutual fund data
 */
async function clearExistingData() {
  try {
    const collection = db.collection('mutualfunds');
    const result = await collection.deleteMany({});
    console.log(`🗑️ Cleared ${result.deletedCount} existing mutual fund records`);
  } catch (error) {
    console.error('❌ Error clearing existing data:', error.message);
    throw error;
  }
}

/**
 * Insert new mutual fund data in batches
 */
async function insertMutualFunds(funds) {
  try {
    const collection = db.collection('mutualfunds');
    const BATCH_SIZE = 1000;
    let insertedCount = 0;
    
    console.log(`💾 Inserting ${funds.length} funds in batches of ${BATCH_SIZE}...`);
    
    for (let i = 0; i < funds.length; i += BATCH_SIZE) {
      const batch = funds.slice(i, i + BATCH_SIZE);
      
      try {
        const result = await collection.insertMany(batch, { ordered: false });
        insertedCount += result.insertedCount;
        
        const progress = ((i + batch.length) / funds.length * 100).toFixed(1);
        console.log(`⏳ Progress: ${i + batch.length}/${funds.length} (${progress}%)`);
        
      } catch (error) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.warn(`⚠️ Some duplicate keys in batch ${Math.floor(i/BATCH_SIZE) + 1}, continuing...`);
          insertedCount += batch.length - (error.result?.writeErrors?.length || 0);
        } else {
          throw error;
        }
      }
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} mutual fund records`);
    return insertedCount;
    
  } catch (error) {
    console.error('❌ Error inserting mutual funds:', error.message);
    throw error;
  }
}

/**
 * Save sync status
 */
async function updateSyncStatus(date, fundCount) {
  try {
    const collection = db.collection('sync_status');
    await collection.replaceOne(
      { type: 'mutual_funds' },
      {
        type: 'mutual_funds',
        lastSyncDate: date.toISOString(),
        fundCount: fundCount,
        status: 'success',
        updatedAt: new Date()
      },
      { upsert: true }
    );
    console.log('📝 Sync status updated');
  } catch (error) {
    console.warn('⚠️ Could not update sync status:', error.message);
  }
}

/**
 * Main sync function
 */
async function syncMutualFunds(dateString = null) {
  const startTime = Date.now();
  
  try {
    // Parse date or use today
    const targetDate = dateString ? new Date(dateString) : new Date();
    
    console.log('🚀 Starting AMFI mutual fund data sync...');
    console.log(`📅 Target date: ${formatDateForAMFI(targetDate)}`);
    console.log(`🕐 Started at: ${new Date().toLocaleString()}\n`);
    
    // Step 1: Connect to MongoDB
    await connectToMongoDB();
    
    // Step 2: Fetch raw data from AMFI
    const rawData = await fetchAMFIData(targetDate);
    
    // Step 3: Parse data
    console.log('🔄 Parsing AMFI data...');
    const funds = parseAMFIData(rawData);
    console.log(`📊 Parsed ${funds.length} mutual funds`);
    
    if (funds.length === 0) {
      throw new Error('No valid fund data found in AMFI response');
    }
    
    // Step 4: Clear existing data
    await clearExistingData();
    
    // Step 5: Insert new data
    const insertedCount = await insertMutualFunds(funds);
    
    // Step 6: Update sync status
    await updateSyncStatus(targetDate, insertedCount);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Sync completed successfully in ${duration} seconds!`);
    console.log(`📈 Total funds processed: ${insertedCount}`);
    console.log(`🕐 Completed at: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n💥 Sync failed after ${duration} seconds:`);
    console.error(`❌ Error: ${error.message}`);
    
    if (error.response?.status) {
      console.error(`🌐 HTTP Status: ${error.response.status} ${error.response.statusText}`);
    }
    
    throw error;
  } finally {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// CLI handling
const args = process.argv.slice(2);
const dateArg = args[0];

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📊 AMFI Daily Mutual Fund Sync Script

Description:
  Fetches latest mutual fund NAV data from AMFI India portal and updates the database.
  This script clears all existing data and replaces it with fresh data.

Usage:
  npm run sync-mf-daily              # Sync today's data
  npm run sync-mf-daily 2025-09-05   # Sync specific date (YYYY-MM-DD)
  npm run sync-mf-daily --help       # Show this help

Examples:
  npm run sync-mf-daily
  npm run sync-mf-daily 2025-09-05
  node scripts/sync-amfi-daily.js 2025-09-05

Note:
  - AMFI data is typically available for the previous working day
  - The script will clear all existing mutual fund data before inserting new data
  - Use this script once daily, preferably in the morning before market opens
`);
  process.exit(0);
}

// Main execution
if (require.main === module) {
  syncMutualFunds(dateArg)
    .then(() => {
      console.log('\n✨ All done! Database updated with latest mutual fund data.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💀 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { syncMutualFunds };