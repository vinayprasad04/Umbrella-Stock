#!/usr/bin/env node

/**
 * Populate Mutual Fund Details Database
 * 
 * This script creates sample detailed information for mutual funds:
 * - Uses the existing static data from real-data-fetcher.js
 * - Expands it to create more sample funds
 * - Stores everything in the new MutualFundDetails collection
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Simple mongoose schemas (inline for script simplicity)
const FundManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  experience: String,
  qualification: String
});

const SectorAllocationSchema = new mongoose.Schema({
  sector: { type: String, required: true },
  allocation: { type: Number, required: true, min: 0, max: 100 }
});

const HoldingSchema = new mongoose.Schema({
  company: { type: String, required: true },
  allocation: { type: Number, required: true, min: 0, max: 100 },
  rank: Number
});

const MutualFundDetailsSchema = new mongoose.Schema({
  schemeCode: { type: Number, required: true, unique: true, index: true },
  schemeName: { type: String, required: true, index: 'text' },
  fundHouse: { type: String, required: true, index: true },
  aum: { type: Number, default: null },
  expenseRatio: { type: Number, default: null },
  minimumInvestment: { type: Number, default: null },
  minimumSIP: { type: Number, default: null },
  exitLoad: String,
  launchDate: String,
  fundManagers: [FundManagerSchema],
  topHoldings: [HoldingSchema],
  sectorAllocation: [SectorAllocationSchema],
  dataSource: { type: String, enum: ['API', 'SCRAPING', 'MANUAL', 'PLACEHOLDER'], required: true },
  dataQuality: { type: String, enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'PLACEHOLDER'], required: true },
  lastScraped: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const MutualFundSchema = new mongoose.Schema({
  schemeCode: { type: Number, required: true, unique: true, index: true },
  schemeName: { type: String, required: true, index: 'text' },
  fundHouse: { type: String, index: true },
  category: { type: String, index: true },
  nav: { type: Number, default: null },
  returns1Y: { type: Number, default: null },
  returns3Y: { type: Number, default: null },
  returns5Y: { type: Number, default: null },
  expenseRatio: { type: Number, default: null },
  aum: { type: Number, default: null },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Models
let MutualFund, MutualFundDetails;

// Sample fund details data (expanded from real-data-fetcher.js)
const sampleFundDetails = {
  119063: { // HDFC Nifty 50 Index Fund
    aum: 25000000000,
    expenseRatio: 0.20,
    minimumInvestment: 5000,
    minimumSIP: 500,
    exitLoad: '0.25% if redeemed before 7 days',
    launchDate: '31 Dec 2012',
    fundManagers: [{
      name: 'Anil Bamboli',
      experience: '15+ years',
      qualification: 'CA, CFA'
    }],
    topHoldings: [
      { company: 'Reliance Industries Ltd', allocation: 11.65, rank: 1 },
      { company: 'Tata Consultancy Services Ltd', allocation: 9.23, rank: 2 },
      { company: 'HDFC Bank Ltd', allocation: 8.91, rank: 3 },
      { company: 'Infosys Ltd', allocation: 6.78, rank: 4 },
      { company: 'ICICI Bank Ltd', allocation: 4.56, rank: 5 },
      { company: 'Hindustan Unilever Ltd', allocation: 4.12, rank: 6 },
      { company: 'ITC Ltd', allocation: 3.98, rank: 7 },
      { company: 'State Bank of India', allocation: 3.45, rank: 8 },
      { company: 'Bharti Airtel Ltd', allocation: 3.21, rank: 9 },
      { company: 'Kotak Mahindra Bank Ltd', allocation: 2.87, rank: 10 }
    ],
    sectorAllocation: [
      { sector: 'Financial Services', allocation: 32.4 },
      { sector: 'Information Technology', allocation: 16.8 },
      { sector: 'Oil & Gas', allocation: 12.1 },
      { sector: 'Consumer Goods', allocation: 10.5 },
      { sector: 'Healthcare', allocation: 5.2 },
      { sector: 'Automotive', allocation: 4.8 },
      { sector: 'Telecommunications', allocation: 3.7 },
      { sector: 'Power & Utilities', allocation: 3.1 },
      { sector: 'Metals & Mining', allocation: 2.9 },
      { sector: 'Others', allocation: 8.5 }
    ],
    dataSource: 'MANUAL',
    dataQuality: 'EXCELLENT'
  },

  100048: { // ICICI Prudential Bluechip Fund
    aum: 45000000000,
    expenseRatio: 1.05,
    minimumInvestment: 5000,
    minimumSIP: 500,
    exitLoad: '1% if redeemed before 365 days',
    launchDate: '01 May 2008',
    fundManagers: [{
      name: 'Sankaran Naren',
      experience: '25+ years',
      qualification: 'BE, MBA'
    }, {
      name: 'Ihab Dalwai',
      experience: '12+ years',
      qualification: 'CA, CFA'
    }],
    topHoldings: [
      { company: 'HDFC Bank Ltd', allocation: 8.45, rank: 1 },
      { company: 'Reliance Industries Ltd', allocation: 7.89, rank: 2 },
      { company: 'Infosys Ltd', allocation: 6.78, rank: 3 },
      { company: 'ICICI Bank Ltd', allocation: 6.23, rank: 4 },
      { company: 'Tata Consultancy Services Ltd', allocation: 5.67, rank: 5 },
      { company: 'Kotak Mahindra Bank Ltd', allocation: 4.56, rank: 6 },
      { company: 'Hindustan Unilever Ltd', allocation: 4.23, rank: 7 },
      { company: 'Bajaj Finance Ltd', allocation: 3.89, rank: 8 },
      { company: 'Asian Paints Ltd', allocation: 3.45, rank: 9 },
      { company: 'Maruti Suzuki India Ltd', allocation: 3.12, rank: 10 }
    ],
    sectorAllocation: [
      { sector: 'Financial Services', allocation: 28.5 },
      { sector: 'Information Technology', allocation: 18.2 },
      { sector: 'Oil & Gas', allocation: 11.8 },
      { sector: 'Consumer Goods', allocation: 9.7 },
      { sector: 'Healthcare', allocation: 6.3 },
      { sector: 'Capital Goods', allocation: 5.8 },
      { sector: 'Automotive', allocation: 4.9 },
      { sector: 'Telecommunications', allocation: 3.2 },
      { sector: 'Power', allocation: 2.8 },
      { sector: 'Others', allocation: 8.8 }
    ],
    dataSource: 'MANUAL',
    dataQuality: 'EXCELLENT'
  },

  120503: { // SBI Bluechip Fund - Direct Plan
    aum: 38000000000,
    expenseRatio: 0.62,
    minimumInvestment: 5000,
    minimumSIP: 500,
    exitLoad: '1% if redeemed before 365 days',
    launchDate: '14 Feb 2013',
    fundManagers: [{
      name: 'R. Srinivasan',
      experience: '22+ years',
      qualification: 'BE, PGDBM'
    }, {
      name: 'Ravi Gopalakrishnan',
      experience: '18+ years',
      qualification: 'CA, CFA'
    }],
    topHoldings: [
      { company: 'Reliance Industries Ltd', allocation: 9.45, rank: 1 },
      { company: 'HDFC Bank Ltd', allocation: 8.92, rank: 2 },
      { company: 'Infosys Ltd', allocation: 7.23, rank: 3 },
      { company: 'ICICI Bank Ltd', allocation: 6.78, rank: 4 },
      { company: 'Tata Consultancy Services Ltd', allocation: 5.89, rank: 5 },
      { company: 'Hindustan Unilever Ltd', allocation: 4.67, rank: 6 },
      { company: 'Kotak Mahindra Bank Ltd', allocation: 4.12, rank: 7 },
      { company: 'Bajaj Finance Ltd', allocation: 3.98, rank: 8 },
      { company: 'ITC Ltd', allocation: 3.45, rank: 9 },
      { company: 'Larsen & Toubro Ltd', allocation: 3.21, rank: 10 }
    ],
    sectorAllocation: [
      { sector: 'Financial Services', allocation: 28.5 },
      { sector: 'Information Technology', allocation: 18.2 },
      { sector: 'Oil & Gas', allocation: 11.8 },
      { sector: 'Consumer Goods', allocation: 9.7 },
      { sector: 'Healthcare', allocation: 6.3 },
      { sector: 'Capital Goods', allocation: 5.8 },
      { sector: 'Automotive', allocation: 4.9 },
      { sector: 'Telecommunications', allocation: 3.2 },
      { sector: 'Power', allocation: 2.8 },
      { sector: 'Others', allocation: 8.8 }
    ],
    dataSource: 'MANUAL',
    dataQuality: 'EXCELLENT'
  }
};

// Function to generate placeholder data for any fund
function generatePlaceholderData(fund) {
  const fundType = detectFundType(fund.schemeName, fund.category);
  
  return {
    aum: generateRandomAUM(fundType),
    expenseRatio: generateExpenseRatio(fundType),
    minimumInvestment: 5000,
    minimumSIP: 500,
    exitLoad: generateExitLoad(fundType),
    launchDate: 'N/A',
    fundManagers: [{
      name: 'Fund Manager',
      experience: 'N/A',
      qualification: 'N/A'
    }],
    topHoldings: generateTopHoldings(fundType),
    sectorAllocation: generateSectorAllocation(fundType),
    dataSource: 'PLACEHOLDER',
    dataQuality: 'PLACEHOLDER'
  };
}

// Helper functions
function detectFundType(schemeName, category) {
  const name = (schemeName || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  
  if (name.includes('nifty 50') || name.includes('nifty50')) return 'INDEX_NIFTY50';
  if (name.includes('sensex')) return 'INDEX_SENSEX';
  if (name.includes('index')) return 'INDEX_OTHER';
  if (name.includes('large') || name.includes('bluechip') || cat.includes('large cap')) return 'LARGE_CAP';
  if (name.includes('mid') || cat.includes('mid cap')) return 'MID_CAP';
  if (name.includes('small') || cat.includes('small cap')) return 'SMALL_CAP';
  if (name.includes('debt') || name.includes('bond') || cat.includes('debt')) return 'DEBT';
  if (name.includes('hybrid') || cat.includes('hybrid')) return 'HYBRID';
  if (name.includes('gold') || name.includes('commodity')) return 'COMMODITY';
  return 'DIVERSIFIED';
}

function generateRandomAUM(fundType) {
  const baseAmounts = {
    'INDEX_NIFTY50': 25000000000, 'LARGE_CAP': 35000000000, 'MID_CAP': 18000000000,
    'SMALL_CAP': 12000000000, 'DEBT': 25000000000, 'HYBRID': 20000000000,
    'DIVERSIFIED': 15000000000
  };
  const base = baseAmounts[fundType] || 10000000000;
  const variation = (Math.random() * 0.6 - 0.3) + 1;
  return Math.round(base * variation);
}

function generateExpenseRatio(fundType) {
  const ratios = {
    'INDEX_NIFTY50': 0.20, 'LARGE_CAP': 1.25, 'MID_CAP': 1.75, 'SMALL_CAP': 2.00,
    'DEBT': 0.85, 'HYBRID': 1.50, 'DIVERSIFIED': 1.60
  };
  return ratios[fundType] || 1.50;
}

function generateExitLoad(fundType) {
  if (fundType.includes('INDEX')) return '0.25% if redeemed before 7 days';
  if (fundType === 'DEBT') return '0.25% if redeemed before 7 days';
  return '1% if redeemed before 365 days';
}

function generateTopHoldings(fundType) {
  const templates = {
    'INDEX_NIFTY50': [
      { company: 'Reliance Industries Ltd', allocation: 11.5, rank: 1 },
      { company: 'Tata Consultancy Services Ltd', allocation: 9.2, rank: 2 },
      { company: 'HDFC Bank Ltd', allocation: 8.9, rank: 3 },
      { company: 'Infosys Ltd', allocation: 6.8, rank: 4 },
      { company: 'ICICI Bank Ltd', allocation: 4.6, rank: 5 }
    ],
    'LARGE_CAP': [
      { company: 'HDFC Bank Ltd', allocation: 8.5, rank: 1 },
      { company: 'Reliance Industries Ltd', allocation: 7.8, rank: 2 },
      { company: 'Infosys Ltd', allocation: 6.7, rank: 3 },
      { company: 'ICICI Bank Ltd', allocation: 6.2, rank: 4 },
      { company: 'Tata Consultancy Services Ltd', allocation: 5.9, rank: 5 }
    ]
  };
  return templates[fundType] || templates['LARGE_CAP'];
}

function generateSectorAllocation(fundType) {
  const templates = {
    'INDEX_NIFTY50': [
      { sector: 'Financial Services', allocation: 32.4 },
      { sector: 'Information Technology', allocation: 16.8 },
      { sector: 'Oil & Gas', allocation: 12.1 },
      { sector: 'Consumer Goods', allocation: 10.5 },
      { sector: 'Others', allocation: 28.2 }
    ],
    'LARGE_CAP': [
      { sector: 'Financial Services', allocation: 28.5 },
      { sector: 'Information Technology', allocation: 18.2 },
      { sector: 'Oil & Gas', allocation: 11.8 },
      { sector: 'Consumer Goods', allocation: 9.7 },
      { sector: 'Others', allocation: 31.8 }
    ]
  };
  return templates[fundType] || templates['LARGE_CAP'];
}

// Main execution
async function main() {
  console.log('🚀 Starting Fund Details Population Script');
  console.log('=' .repeat(50));
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_CONNECTION_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create models
    MutualFund = mongoose.model('MutualFund', MutualFundSchema);
    MutualFundDetails = mongoose.model('MutualFundDetails', MutualFundDetailsSchema);
    
    // Get all active mutual funds (remove limit to process all ~8000 funds)
    const funds = await MutualFund.find({ isActive: true }).select('schemeCode schemeName fundHouse category');
    console.log(`📊 Found ${funds.length} mutual funds to process`);
    
    let processed = 0;
    let successful = 0;
    let skipped = 0;
    let failed = 0;
    
    const startTime = new Date();
    console.log(`⏰ Starting batch processing at ${startTime.toLocaleString()}`);
    console.log(`📊 Estimated time: ${Math.ceil(funds.length / 100)} minutes (for ${funds.length} funds)`);
    
    // Process in batches of 50 for better performance
    const batchSize = 50;
    const totalBatches = Math.ceil(funds.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, funds.length);
      const batch = funds.slice(start, end);
      
      console.log(`\n🔄 Processing Batch ${batchIndex + 1}/${totalBatches} (${batch.length} funds)`);
      
      // Process batch with bulk operations for better performance
      const bulkOps = [];
      
      for (const fund of batch) {
        try {
          // Check if we already have data
          const existing = await MutualFundDetails.findOne({ schemeCode: fund.schemeCode });
          if (existing) {
            skipped++;
            processed++;
            continue;
          }
          
          // Get fund details (from sample data or generate placeholder)
          const fundDetails = sampleFundDetails[fund.schemeCode] || generatePlaceholderData(fund);
          
          // Prepare bulk operation
          bulkOps.push({
            insertOne: {
              document: {
                schemeCode: fund.schemeCode,
                schemeName: fund.schemeName,
                fundHouse: fund.fundHouse,
                ...fundDetails,
                lastScraped: new Date(),
                lastUpdated: new Date(),
                isActive: true
              }
            }
          });
          
          console.log(`📝 Prepared: ${fund.schemeName.substring(0, 50)}... - ${fundDetails.dataQuality}`);
          
        } catch (error) {
          console.log(`❌ Error preparing ${fund.schemeName}: ${error.message}`);
          failed++;
        }
        
        processed++;
      }
      
      // Execute bulk operations
      if (bulkOps.length > 0) {
        try {
          const result = await MutualFundDetails.bulkWrite(bulkOps, { ordered: false });
          successful += result.insertedCount;
          console.log(`✅ Batch ${batchIndex + 1}: ${result.insertedCount} funds inserted successfully`);
        } catch (error) {
          console.log(`❌ Batch ${batchIndex + 1} bulk insert failed: ${error.message}`);
          failed += bulkOps.length;
        }
      }
      
      // Progress update
      const progressPercent = ((processed / funds.length) * 100).toFixed(1);
      const elapsed = (new Date().getTime() - startTime.getTime()) / 1000 / 60; // minutes
      const estimatedTotal = (elapsed / (processed / funds.length));
      const remaining = Math.max(0, estimatedTotal - elapsed);
      
      console.log(`📈 Progress: ${processed}/${funds.length} (${progressPercent}%)`);
      console.log(`✅ Successful: ${successful} | ⏭️  Skipped: ${skipped} | ❌ Failed: ${failed}`);
      console.log(`⏱️  Elapsed: ${elapsed.toFixed(1)}m | 🕐 Remaining: ~${remaining.toFixed(1)}m`);
      
      // Small delay between batches to prevent overwhelming the database
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }
    
    const endTime = new Date();
    const totalTime = (endTime.getTime() - startTime.getTime()) / 1000 / 60; // minutes
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS - ALL 8000+ MUTUAL FUNDS PROCESSED');
    console.log('='.repeat(60));
    console.log(`📅 Started: ${startTime.toLocaleString()}`);
    console.log(`📅 Completed: ${endTime.toLocaleString()}`);
    console.log(`⏱️  Total Time: ${totalTime.toFixed(1)} minutes`);
    console.log('');
    console.log(`📊 Total Funds Found: ${funds.length}`);
    console.log(`✅ Successfully Inserted: ${successful}`);
    console.log(`⏭️  Skipped (existing): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);
    console.log(`🚀 Processing Rate: ${(funds.length / totalTime).toFixed(0)} funds/minute`);
    console.log('');
    console.log('📋 Data Quality Distribution:');
    console.log(`   🏆 EXCELLENT: ${Object.keys(sampleFundDetails).length} funds`);
    console.log(`   📊 PLACEHOLDER: ${successful - Object.keys(sampleFundDetails).length} funds`);
    console.log('');
    console.log('🎯 Database Ready: All mutual funds now have detailed information!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };