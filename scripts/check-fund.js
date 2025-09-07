#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkFund() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_CONNECTION_URI);
    const db = client.db();
    
    const fund = await db.collection('mutualfunddetails').findOne({ 
      schemeName: { $regex: 'DSP Silver ETF.*IDCW', $options: 'i' } 
    });
    
    if (fund) {
      console.log('='.repeat(60));
      console.log('🔍 FUND DETAILS FOUND:');
      console.log('='.repeat(60));
      console.log('Scheme Name:', fund.schemeName);
      console.log('Fund House:', fund.fundHouse);
      console.log('AUM:', fund.aum?.toLocaleString(), 'INR');
      console.log('Expense Ratio:', fund.expenseRatio + '%');
      console.log('Exit Load:', fund.exitLoad);
      console.log('Data Quality:', fund.dataQuality);
      console.log('Data Source:', fund.dataSource);
      console.log('');
      console.log('Top Holdings:');
      fund.topHoldings?.slice(0, 5).forEach((holding, i) => {
        console.log(`  ${i+1}. ${holding.company} - ${holding.allocation}%`);
      });
      console.log('');
      console.log('Sector Allocation:');
      fund.sectorAllocation?.slice(0, 5).forEach((sector, i) => {
        console.log(`  ${i+1}. ${sector.sector} - ${sector.allocation}%`);
      });
      console.log('='.repeat(60));
    } else {
      console.log('❌ Fund not found');
      
      // Try to find similar funds
      const similarFunds = await db.collection('mutualfunddetails').find({ 
        schemeName: { $regex: 'DSP.*Silver', $options: 'i' } 
      }).limit(3).toArray();
      
      console.log('\n🔍 Similar funds found:');
      similarFunds.forEach(f => console.log(' -', f.schemeName));
    }
    
    client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFund();