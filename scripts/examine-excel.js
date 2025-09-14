const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the HDFC Bank.xlsx file
const filePath = '/home/qss/Downloads/HDFC Bank.xlsx';

try {
  console.log('🔍 Examining Excel file:', filePath);

  // Read the workbook
  const workbook = XLSX.readFile(filePath);

  console.log('\n📋 Sheet Names:');
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`${index + 1}. ${sheetName}`);
  });

  // Examine each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n📊 Sheet ${index + 1}: "${sheetName}"`);
    console.log('=' .repeat(50));

    const worksheet = workbook.Sheets[sheetName];

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    console.log(`Range: ${worksheet['!ref'] || 'Empty'}`);

    // Convert to JSON to see the structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    });

    console.log(`Total rows: ${jsonData.length}`);

    // Show first few rows
    if (jsonData.length > 0) {
      console.log('\n📝 First 10 rows:');
      jsonData.slice(0, 10).forEach((row, rowIndex) => {
        console.log(`Row ${rowIndex + 1}:`, row.slice(0, 10)); // Show first 10 columns
      });

      // If there are more than 10 rows, show structure info
      if (jsonData.length > 10) {
        console.log(`... and ${jsonData.length - 10} more rows`);
      }
    }

    // Show column headers if available (assuming first row contains headers)
    if (jsonData.length > 0 && jsonData[0]) {
      console.log('\n📋 Possible Headers (Row 1):');
      jsonData[0].forEach((header, colIndex) => {
        if (header && header.toString().trim()) {
          console.log(`Column ${String.fromCharCode(65 + colIndex)}: ${header}`);
        }
      });
    }

    // Look for non-empty cells to understand data patterns
    const nonEmptyCells = [];
    for (let row = 0; row < Math.min(20, jsonData.length); row++) {
      for (let col = 0; col < Math.min(20, jsonData[row] ? jsonData[row].length : 0); col++) {
        if (jsonData[row] && jsonData[row][col] && jsonData[row][col].toString().trim()) {
          nonEmptyCells.push({
            position: `${String.fromCharCode(65 + col)}${row + 1}`,
            value: jsonData[row][col]
          });
        }
      }
    }

    console.log(`\n🎯 Sample non-empty cells (first 20):`);
    nonEmptyCells.slice(0, 20).forEach(cell => {
      console.log(`${cell.position}: ${cell.value}`);
    });
  });

} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
}