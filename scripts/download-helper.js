const fs = require('fs');
const path = require('path');
const config = require('./config.js');

class DownloadHelper {
  constructor() {
    this.stockSymbols = config.stockSymbols;
    this.downloadPath = config.downloadPath;
  }

  generateDownloadScript() {
    console.log('🚀 Generating download script...\n');

    const batchCommands = [];
    const urls = [];

    this.stockSymbols.forEach(symbol => {
      const url = `https://www.screener.in/company/${symbol}/`;
      urls.push(`${symbol}: ${url}`);

      // PowerShell command to open URL in browser
      batchCommands.push(`start "" "${url}"`);
    });

    // Create batch file for Windows
    const batchContent = `@echo off
echo =====================================
echo Bulk Download Helper for Stock Data
echo =====================================
echo.
echo This will open all stock pages in your browser.
echo Click "Export to Excel" on each page and save files as:
echo ${this.stockSymbols.map(s => s + '.xlsx').join(', ')}
echo.
echo Save all files to: ${path.resolve(this.downloadPath)}
echo.
pause
echo.
echo Opening all stock pages...
echo.

${batchCommands.join('\n')}

echo.
echo All pages opened! Download Excel files and save them in downloads folder.
echo Then run: npm run automate-all
echo.
pause`;

    fs.writeFileSync(path.join(__dirname, 'open-all-stocks.bat'), batchContent);

    // Create PowerShell script for better automation
    const psContent = `# PowerShell script to help with bulk downloads
Write-Host "📊 Stock Data Download Helper" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

$stocks = @(${this.stockSymbols.map(s => `"${s}"`).join(', ')})
$downloadPath = "${path.resolve(this.downloadPath).replace(/\\/g, '\\\\')}"

Write-Host "🔄 Opening all stock pages..." -ForegroundColor Yellow
Write-Host ""

foreach ($stock in $stocks) {
    $url = "https://www.screener.in/company/$stock/"
    Write-Host "Opening: $stock - $url" -ForegroundColor Cyan
    Start-Process $url
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "✅ All pages opened in your browser!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "1. On each page, click 'Export to Excel' button"
Write-Host "2. Save each file as {SYMBOL}.xlsx in: $downloadPath"
Write-Host "3. Run: npm run automate-all"
Write-Host ""
Write-Host "Expected files:" -ForegroundColor Cyan
foreach ($stock in $stocks) {
    Write-Host "  $stock.xlsx" -ForegroundColor White
}`;

    fs.writeFileSync(path.join(__dirname, 'download-helper.ps1'), psContent);

    console.log('✅ Helper scripts created:');
    console.log('📁 open-all-stocks.bat - Opens all URLs in browser');
    console.log('📁 download-helper.ps1 - PowerShell version with better formatting');
    console.log('');
    console.log('🚀 Usage:');
    console.log('1. Run: open-all-stocks.bat');
    console.log('2. Click "Export to Excel" on each opened page');
    console.log('3. Save files as SYMBOL.xlsx in downloads folder');
    console.log('4. Run: npm run automate-all');
    console.log('');
    console.log('📋 URLs to visit:');
    urls.forEach(url => console.log(`   ${url}`));
  }

  checkDownloadFolder() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
      console.log(`📁 Created downloads folder: ${this.downloadPath}`);
    }

    const files = fs.readdirSync(this.downloadPath).filter(f => f.endsWith('.xlsx'));
    const expectedFiles = this.stockSymbols.map(s => `${s}.xlsx`);

    console.log('\n📊 Download Status:');
    console.log('==================');

    expectedFiles.forEach(file => {
      const exists = files.includes(file);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${file}`);
    });

    const downloaded = expectedFiles.filter(f => files.includes(f)).length;
    console.log(`\n📈 Progress: ${downloaded}/${expectedFiles.length} files downloaded`);

    if (downloaded === expectedFiles.length) {
      console.log('\n🎉 All files ready! Run: npm run automate-all');
    } else {
      console.log(`\n⚠️  Still need ${expectedFiles.length - downloaded} files`);
    }
  }
}

// Command line interface
const args = process.argv.slice(2);
const helper = new DownloadHelper();

if (args.includes('--check') || args.includes('-c')) {
  helper.checkDownloadFolder();
} else {
  helper.generateDownloadScript();
}