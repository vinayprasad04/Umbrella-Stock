const XLSX = require('xlsx');

const filePath = '/home/qss/Downloads/HDFC Bank.xlsx';

try {
  console.log('🔍 Detailed Analysis of HDFC Bank Excel File');

  const workbook = XLSX.readFile(filePath);
  const dataSheet = workbook.Sheets['Data Sheet'];

  // Convert to JSON with all data
  const jsonData = XLSX.utils.sheet_to_json(dataSheet, {
    header: 1,
    defval: '',
    raw: false
  });

  console.log('\n📊 Data Sheet Complete Structure:');
  console.log('================================\n');

  // Track sections
  let currentSection = '';
  const sections = {
    META: [],
    'PROFIT & LOSS': [],
    'BALANCE SHEET': [],
    'CASH FLOW': [],
    'RATIOS': [],
    'VALUATION': []
  };

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const firstCell = row[0] ? row[0].toString().trim() : '';

    // Check if this row starts a new section
    if (firstCell && ['META', 'PROFIT & LOSS', 'BALANCE SHEET', 'CASH FLOW', 'RATIOS', 'VALUATION'].includes(firstCell)) {
      currentSection = firstCell;
      console.log(`\n📋 Section: ${currentSection}`);
      console.log('-'.repeat(30));
      continue;
    }

    // Skip empty rows
    if (!firstCell && !row[1]) {
      continue;
    }

    // Print the row with meaningful data
    if (firstCell && currentSection) {
      const data = {
        field: firstCell,
        values: []
      };

      // Collect non-empty values
      for (let j = 1; j < row.length; j++) {
        if (row[j] && row[j].toString().trim()) {
          data.values.push(row[j]);
        }
      }

      if (data.values.length > 0) {
        console.log(`${firstCell}: ${data.values.join(', ')}`);
        sections[currentSection].push(data);
      }
    }
  }

  // Show column headers (years) for financial data
  console.log('\n🗓️ Year Headers Detection:');
  console.log('=========================');

  // Find the row with "Report Date" which should contain years
  for (let i = 0; i < jsonData.length; i++) {
    if (jsonData[i][0] && jsonData[i][0].toString().includes('Report Date')) {
      console.log('Report Date Row:', jsonData[i]);
      break;
    }
  }

  // Summary of data structure
  console.log('\n📈 Summary by Section:');
  console.log('=====================');
  Object.keys(sections).forEach(section => {
    console.log(`${section}: ${sections[section].length} items`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
}