# PowerShell script to help with bulk downloads
Write-Host "📊 Stock Data Download Helper" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

$stocks = @("HDFCBANK", "RELIANCE", "TCS", "INFY", "ICICIBANK", "BHARTIARTL", "ITC", "SBIN", "LT", "KOTAKBANK", "HCLTECH", "ASIANPAINT", "MARUTI", "AXISBANK", "TITAN", "NESTLEIND", "ULTRACEMCO", "BAJFINANCE", "SUNPHARMA", "WIPRO")
$downloadPath = "D:\\work\\Test\\Next\\Umberlla-Stock\\scripts\\downloads"

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
}