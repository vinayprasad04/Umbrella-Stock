const fs = require('fs');
const path = require('path');

const downloadPath = './downloads';

// Mapping of downloaded file names to expected stock symbols
const fileMapping = {
  'Asian Paints.xlsx': 'ASIANPAINT.xlsx',
  'Axis Bank.xlsx': 'AXISBANK.xlsx',
  'Bajaj Finance.xlsx': 'BAJFINANCE.xlsx',
  'Bharti Airtel.xlsx': 'BHARTIARTL.xlsx',
  'HCL Technologies.xlsx': 'HCLTECH.xlsx',
  'ICICI Bank.xlsx': 'ICICIBANK.xlsx',
  'Infosys.xlsx': 'INFY.xlsx',
  'ITC.xlsx': 'ITC.xlsx', // Already correct
  'Kotak Mah. Bank.xlsx': 'KOTAKBANK.xlsx',
  'Larsen & Toubro.xlsx': 'LT.xlsx',
  'Maruti Suzuki.xlsx': 'MARUTI.xlsx',
  'Nestle India.xlsx': 'NESTLEIND.xlsx',
  'Reliance Industr.xlsx': 'RELIANCE.xlsx',
  'SBI.xlsx': 'SBIN.xlsx',
  'Sun Pharma.Inds.xlsx': 'SUNPHARMA.xlsx',
  'TCS.xlsx': 'TCS.xlsx', // Already correct
  'Titan Company.xlsx': 'TITAN.xlsx',
  'UltraTech Cem.xlsx': 'ULTRACEMCO.xlsx',
  'Wipro.xlsx': 'WIPRO.xlsx', // Already correct
  'HDFC Bank.xlsx': 'HDFCBANK.xlsx' // In case you download this one
};

function renameFiles() {
  console.log('🔄 Renaming downloaded files to match stock symbols...\n');

  if (!fs.existsSync(downloadPath)) {
    console.log('❌ Downloads folder not found!');
    return;
  }

  const files = fs.readdirSync(downloadPath);
  let renamed = 0;
  let alreadyCorrect = 0;
  let notFound = 0;

  Object.entries(fileMapping).forEach(([oldName, newName]) => {
    const oldPath = path.join(downloadPath, oldName);
    const newPath = path.join(downloadPath, newName);

    if (fs.existsSync(oldPath)) {
      if (oldName === newName) {
        console.log(`✅ ${oldName} - Already correct`);
        alreadyCorrect++;
      } else {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`✅ Renamed: ${oldName} → ${newName}`);
          renamed++;
        } catch (error) {
          console.log(`❌ Error renaming ${oldName}: ${error.message}`);
        }
      }
    } else {
      console.log(`⚠️  Not found: ${oldName}`);
      notFound++;
    }
  });

  console.log('\n📊 Rename Summary:');
  console.log('==================');
  console.log(`✅ Renamed: ${renamed}`);
  console.log(`✅ Already correct: ${alreadyCorrect}`);
  console.log(`⚠️  Not found: ${notFound}`);

  // Show final file list
  console.log('\n📁 Final files in downloads folder:');
  const finalFiles = fs.readdirSync(downloadPath);
  finalFiles.forEach(file => {
    console.log(`   ${file}`);
  });

  if (renamed > 0) {
    console.log('\n🎉 Files renamed successfully! Now run: npm run automate-all');
  }
}

renameFiles();