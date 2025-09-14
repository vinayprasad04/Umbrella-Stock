const XLSX = require('xlsx');

const filePath = '/home/qss/Downloads/HDFC Bank.xlsx';

try {
  console.log('🔍 Comprehensive Analysis of ALL Excel Sheets');
  console.log('==============================================\n');

  const workbook = XLSX.readFile(filePath);

  console.log(`📋 Found ${workbook.SheetNames.length} sheets:`);
  workbook.SheetNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });

  // Skip Customization sheet as requested
  const sheetsToAnalyze = workbook.SheetNames.filter(name => name !== 'Customization');

  sheetsToAnalyze.forEach((sheetName, sheetIndex) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 SHEET ${sheetIndex + 1}: "${sheetName}"`);
    console.log(`${'='.repeat(60)}`);

    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet['!ref']) {
      console.log('⚠️ Empty sheet');
      return;
    }

    // Convert to JSON to see the structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    });

    console.log(`📏 Range: ${worksheet['!ref']}`);
    console.log(`📄 Total rows: ${jsonData.length}`);

    // Show all meaningful data
    console.log('\n📝 Complete Sheet Data:');
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const hasContent = row.some(cell => cell && cell.toString().trim());

      if (hasContent) {
        console.log(`Row ${i + 1}:`, row);
      }
    }

    // Look for headers and data patterns
    console.log('\n🎯 Data Analysis:');

    // Find potential header rows
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.some(cell => cell && cell.toString().includes('Narration'))) {
        console.log(`📋 Potential header row at ${i + 1}:`, row);
      }
    }

    // Find rows with years (Mar-XX format)
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.some(cell => cell && cell.toString().match(/Mar-\d{2}/))) {
        console.log(`📅 Year header row at ${i + 1}:`, row);
        break; // Only show first occurrence
      }
    }

    // Count non-empty rows
    const nonEmptyRows = jsonData.filter(row =>
      row && row.some(cell => cell && cell.toString().trim())
    );
    console.log(`📊 Non-empty rows: ${nonEmptyRows.length}`);

    // Show structure summary
    if (nonEmptyRows.length > 0) {
      console.log('\n📈 Data Structure Summary:');
      const maxCols = Math.max(...nonEmptyRows.map(row => row.length));
      console.log(`Max columns: ${maxCols}`);

      // Show first few meaningful rows for structure
      console.log('\nFirst 5 meaningful rows:');
      nonEmptyRows.slice(0, 5).forEach((row, index) => {
        console.log(`  ${index + 1}: [${row.slice(0, 8).join(' | ')}]`);
      });
    }
  });

  console.log('\n\n🏁 Analysis Complete!');
  console.log(`Total sheets analyzed: ${sheetsToAnalyze.length}`);
  console.log('Sheets excluded: Customization (as requested)');

} catch (error) {
  console.error('❌ Error:', error.message);
}