@echo off
echo =====================================
echo Bulk Download Helper for Stock Data
echo =====================================
echo.
echo This will open all stock pages in your browser.
echo Click "Export to Excel" on each page and save files as:
echo HDFCBANK.xlsx, RELIANCE.xlsx, TCS.xlsx, INFY.xlsx, ICICIBANK.xlsx, BHARTIARTL.xlsx, ITC.xlsx, SBIN.xlsx, LT.xlsx, KOTAKBANK.xlsx, HCLTECH.xlsx, ASIANPAINT.xlsx, MARUTI.xlsx, AXISBANK.xlsx, TITAN.xlsx, NESTLEIND.xlsx, ULTRACEMCO.xlsx, BAJFINANCE.xlsx, SUNPHARMA.xlsx, WIPRO.xlsx
echo.
echo Save all files to: D:\work\Test\Next\Umberlla-Stock\scripts\downloads
echo.
pause
echo.
echo Opening all stock pages...
echo.

start "" "https://www.screener.in/company/HDFCBANK/"
start "" "https://www.screener.in/company/RELIANCE/"
start "" "https://www.screener.in/company/TCS/"
start "" "https://www.screener.in/company/INFY/"
start "" "https://www.screener.in/company/ICICIBANK/"
start "" "https://www.screener.in/company/BHARTIARTL/"
start "" "https://www.screener.in/company/ITC/"
start "" "https://www.screener.in/company/SBIN/"
start "" "https://www.screener.in/company/LT/"
start "" "https://www.screener.in/company/KOTAKBANK/"
start "" "https://www.screener.in/company/HCLTECH/"
start "" "https://www.screener.in/company/ASIANPAINT/"
start "" "https://www.screener.in/company/MARUTI/"
start "" "https://www.screener.in/company/AXISBANK/"
start "" "https://www.screener.in/company/TITAN/"
start "" "https://www.screener.in/company/NESTLEIND/"
start "" "https://www.screener.in/company/ULTRACEMCO/"
start "" "https://www.screener.in/company/BAJFINANCE/"
start "" "https://www.screener.in/company/SUNPHARMA/"
start "" "https://www.screener.in/company/WIPRO/"

echo.
echo All pages opened! Download Excel files and save them in downloads folder.
echo Then run: npm run automate-all
echo.
pause