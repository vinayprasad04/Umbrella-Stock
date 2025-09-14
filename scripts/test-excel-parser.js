const XLSX = require('xlsx');
const fs = require('fs');

// Import our Excel parser
const { ExcelParser } = require('../lib/utils/excelParser.ts');

const filePath = '/home/qss/Downloads/HDFC Bank.xlsx';

try {
  console.log('🧪 Testing Excel Parser with HDFC Bank.xlsx');
  console.log('=================================================\n');

  // Read the file as buffer
  const fileBuffer = fs.readFileSync(filePath);
  console.log('✅ File read successfully, size:', fileBuffer.length, 'bytes');

  // Test our parser
  console.log('\n🔍 Testing ExcelParser.parseStockExcel()...');
  const result = ExcelParser.parseStockExcel(fileBuffer);

  if (!result) {
    console.error('❌ Parser returned null - no data extracted');
    return;
  }

  console.log('\n📊 PARSING RESULTS:');
  console.log('==================');

  // Meta information
  console.log('\n📈 META INFORMATION:');
  console.log('Company Name:', result.meta.companyName);
  console.log('Face Value:', result.meta.faceValue);
  console.log('Current Price:', result.meta.currentPrice);
  console.log('Market Cap:', result.meta.marketCapitalization);
  console.log('Number of Shares:', result.meta.numberOfShares);

  // Profit & Loss data count
  console.log('\n💰 PROFIT & LOSS DATA:');
  Object.keys(result.profitAndLoss).forEach(key => {
    const count = result.profitAndLoss[key].length;
    console.log(`${key}: ${count} years of data`);
    if (count > 0) {
      console.log(`  Sample: ${result.profitAndLoss[key][0].year} = ${result.profitAndLoss[key][0].value}`);
    }
  });

  // Balance Sheet data count
  console.log('\n🏦 BALANCE SHEET DATA:');
  Object.keys(result.balanceSheet).forEach(key => {
    const count = result.balanceSheet[key].length;
    console.log(`${key}: ${count} years of data`);
    if (count > 0) {
      console.log(`  Sample: ${result.balanceSheet[key][0].year} = ${result.balanceSheet[key][0].value}`);
    }
  });

  // Cash Flow data count
  console.log('\n💸 CASH FLOW DATA:');
  Object.keys(result.cashFlow).forEach(key => {
    const count = result.cashFlow[key].length;
    console.log(`${key}: ${count} years of data`);
    if (count > 0) {
      console.log(`  Sample: ${result.cashFlow[key][0].year} = ${result.cashFlow[key][0].value}`);
    }
  });

  // Quarterly data count
  console.log('\n📅 QUARTERLY DATA:');
  Object.keys(result.quarterlyData).forEach(key => {
    const count = result.quarterlyData[key].length;
    console.log(`${key}: ${count} quarters of data`);
    if (count > 0) {
      console.log(`  Sample: ${result.quarterlyData[key][0].quarter} = ${result.quarterlyData[key][0].value}`);
    }
  });

  // Price data
  console.log('\n📈 PRICE DATA:');
  console.log(`Price data points: ${result.priceData.length}`);
  if (result.priceData.length > 0) {
    console.log('Sample prices:', result.priceData.slice(0, 3));
  }

  console.log('\n🏁 Parser test completed!');

} catch (error) {
  console.error('❌ Error testing parser:', error.message);
  console.error(error.stack);
}