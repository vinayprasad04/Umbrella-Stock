const fs = require('fs');
const csv = require('csv-parser');

const testFile = 'c:\\Users\\QSS\\Downloads\\MW-NIFTY-50-30-Sep-2025.csv';

console.log('🔍 Debugging CSV structure...');

// First, let's read the raw file content
console.log('\n📄 Raw file content (first 500 chars):');
const rawContent = fs.readFileSync(testFile, 'utf8');
console.log(rawContent.substring(0, 500));

console.log('\n📄 Headers analysis:');
const lines = rawContent.split('\n');
console.log('First line:', JSON.stringify(lines[0]));
console.log('Second line:', JSON.stringify(lines[1]));
console.log('Third line:', JSON.stringify(lines[2]));

console.log('\n📊 CSV parsing test:');
let count = 0;
fs.createReadStream(testFile)
  .pipe(csv({
    skipEmptyLines: true,
    skipLinesWithError: true
  }))
  .on('headers', (headers) => {
    console.log('Headers found:', headers);
  })
  .on('data', (row) => {
    count++;
    if (count <= 5) {
      console.log(`Row ${count}:`, row);
      console.log(`SYMBOL variants:`, {
        'SYMBOL': row.SYMBOL,
        'SYMBOL ': row['SYMBOL '],
        '﻿SYMBOL ': row['﻿SYMBOL '],
        'Symbol': row.Symbol
      });
    }
  })
  .on('end', () => {
    console.log(`\n✅ Total rows processed: ${count}`);
  })
  .on('error', (error) => {
    console.error('❌ CSV parsing error:', error);
  });