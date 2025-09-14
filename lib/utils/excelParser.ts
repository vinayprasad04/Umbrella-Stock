import * as XLSX from 'xlsx';

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  range: string;
  totalRows: number;
}

interface ParsedExcelData {
  meta: {
    companyName: string;
    faceValue: number;
    currentPrice: number;
    marketCapitalization: number;
    numberOfShares?: number;
  };
  profitAndLoss: {
    sales: any[];
    rawMaterialCost: any[];
    changeInInventory: any[];
    powerAndFuel: any[];
    otherMfrExp: any[];
    employeeCost: any[];
    sellingAndAdmin: any[];
    otherExpenses: any[];
    otherIncome: any[];
    depreciation: any[];
    interest: any[];
    profitBeforeTax: any[];
    tax: any[];
    netProfit: any[];
    dividendAmount: any[];
  };
  quarterlyData: {
    sales: any[];
    expenses: any[];
    otherIncome: any[];
    depreciation: any[];
    interest: any[];
    profitBeforeTax: any[];
    tax: any[];
    netProfit: any[];
    operatingProfit: any[];
  };
  balanceSheet: {
    equityShareCapital: any[];
    reserves: any[];
    borrowings: any[];
    otherLiabilities: any[];
    total: any[];
    netBlock: any[];
    capitalWorkInProgress: any[];
    investments: any[];
    otherAssets: any[];
    receivables: any[];
    inventory: any[];
    cashAndBank: any[];
    numberOfEquityShares: any[];
    newBonusShares: any[];
    faceValue: any[];
    adjustedEquityShares: any[];
  };
  cashFlow: {
    cashFromOperatingActivity: any[];
    cashFromInvestingActivity: any[];
    cashFromFinancingActivity: any[];
    netCashFlow: any[];
  };
  priceData: any[];
  // New: Raw sheet data
  sheetData: SheetData[];
}

export class ExcelParser {

  // Centralized cell parsing to handle all missing/empty/dash values consistently
  private static parseCell(cell: any): number {
    if (cell === undefined || cell === null || cell === '') return 0;
    if (cell === '-' || cell === '—' || cell === '–' || cell === 'N/A' || cell === 'n/a') return 0;
    const cellStr = cell.toString().trim();
    if (cellStr === '' || cellStr === '-' || cellStr === '—' || cellStr === '–' || cellStr.toLowerCase() === 'n/a') return 0;
    const parsed = parseFloat(cellStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  static parseStockExcel(buffer: ArrayBuffer): ParsedExcelData | null {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Check if "Data Sheet" exists
      if (!workbook.Sheets['Data Sheet']) {
        console.error('Data Sheet not found in Excel file');
        return null;
      }

      const dataSheet = workbook.Sheets['Data Sheet'];
      const jsonData = XLSX.utils.sheet_to_json(dataSheet, {
        header: 1,
        defval: '',
        raw: false
      });

      console.log('📊 Parsing Excel data...');

      // Parse only the Data Sheet (ignore all other sheets)
      const sheetData: SheetData[] = [];
      const dataSheetName = 'Data Sheet';

      if (workbook.Sheets[dataSheetName]) {
        const worksheet = workbook.Sheets[dataSheetName];
        if (worksheet['!ref']) {
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
          });

          // Filter out completely empty rows
          const nonEmptyRows = jsonData.filter((row: any) =>
            row && row.some((cell: any) => cell && cell.toString().trim())
          ) as any[][];

          // For Data Sheet, use first row as headers
          const firstRow = nonEmptyRows[0] as string[] || [];
          const headers = firstRow.map(cell => cell ? cell.toString().trim() : '');

          sheetData.push({
            sheetName: dataSheetName,
            headers,
            rows: nonEmptyRows,
            range: worksheet['!ref'],
            totalRows: nonEmptyRows.length
          });

          console.log(`📊 Processing only Data Sheet: ${nonEmptyRows.length} rows`);
        }
      } else {
        console.warn('⚠️ Data Sheet not found in workbook');
      }

      const result: ParsedExcelData = {
        meta: {
          companyName: '',
          faceValue: 0,
          currentPrice: 0,
          marketCapitalization: 0
        },
        profitAndLoss: {
          sales: [],
          rawMaterialCost: [],
          changeInInventory: [],
          powerAndFuel: [],
          otherMfrExp: [],
          employeeCost: [],
          sellingAndAdmin: [],
          otherExpenses: [],
          otherIncome: [],
          depreciation: [],
          interest: [],
          profitBeforeTax: [],
          tax: [],
          netProfit: [],
          dividendAmount: []
        },
        quarterlyData: {
          sales: [],
          expenses: [],
          otherIncome: [],
          depreciation: [],
          interest: [],
          profitBeforeTax: [],
          tax: [],
          netProfit: [],
          operatingProfit: []
        },
        balanceSheet: {
          equityShareCapital: [],
          reserves: [],
          borrowings: [],
          otherLiabilities: [],
          total: [],
          netBlock: [],
          capitalWorkInProgress: [],
          investments: [],
          otherAssets: [],
          receivables: [],
          inventory: [],
          cashAndBank: [],
          numberOfEquityShares: [],
          newBonusShares: [],
          faceValue: [],
          adjustedEquityShares: []
        },
        cashFlow: {
          cashFromOperatingActivity: [],
          cashFromInvestingActivity: [],
          cashFromFinancingActivity: [],
          netCashFlow: []
        },
        priceData: [],
        sheetData: sheetData
      };

      let yearHeaders: string[] = [];
      let quarterHeaders: string[] = [];
      let balanceSheetHeaders: string[] = [];
      let cashFlowHeaders: string[] = [];
      let currentSection: string = 'META'; // Track which section we're currently in

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as string[];
        const firstCell = row[0] ? row[0].toString().trim() : '';

        // Extract company name
        if (firstCell.includes('COMPANY NAME') && row[1]) {
          result.meta.companyName = row[1].toString().trim();
          continue;
        }

        // Extract meta information
        if (firstCell.includes('Face Value') && row[1]) {
          result.meta.faceValue = parseFloat(row[1]) || 0;
          continue;
        }

        if (firstCell.includes('Current Price') && row[1]) {
          result.meta.currentPrice = parseFloat(row[1]) || 0;
          continue;
        }

        if (firstCell.includes('Market Capitalization') && row[1]) {
          result.meta.marketCapitalization = parseFloat(row[1]) || 0;
          continue;
        }

        if (firstCell.includes('Number of shares') && row[1]) {
          result.meta.numberOfShares = parseFloat(row[1]) || 0;
          continue;
        }

        // Also handle "Adjusted Equity Shares in Cr" field
        if (firstCell.includes('Adjusted Equity Shares') && row[1]) {
          result.meta.numberOfShares = parseFloat(row[1]) || 0;
          continue;
        }

        // Detect quarterly headers FIRST (Report Date with Mar-23, Jun-23, etc.)
        if (firstCell === 'Report Date' && row.some(cell => cell && cell.toString().match(/(Mar|Jun|Sep|Dec)-\d{2}/))) {
          const headers = row.slice(1).filter(cell => cell && cell.toString().trim() && cell.toString().match(/(Mar|Jun|Sep|Dec)-\d{2}/));
          if (headers.length >= 4 && headers.some(h => h.toString().match(/(Jun|Sep|Dec)-\d{2}/))) { // Quarterly data should have different quarters (not just Mar)
            quarterHeaders = headers;
            console.log('📅 Found quarterly headers:', quarterHeaders);
            continue;
          }
        }

        // Detect PROFIT & LOSS section and year headers (only Mar dates)
        if (firstCell === 'Report Date' && row.some(cell => cell && cell.toString().match(/Mar-\d{2}/))) {
          const headers = row.slice(1).filter(cell => cell && cell.toString().trim() && cell.toString().match(/Mar-\d{2}/));
          if (headers.length > 0 && !headers.some(h => h.toString().match(/(Jun|Sep|Dec)-\d{2}/))) { // Only Mar dates, not quarterly
            yearHeaders = headers;
            console.log('📅 Found year headers:', yearHeaders);
            continue;
          }
        }

        // Parse Profit & Loss data (only when in PROFIT_LOSS section)
        if (currentSection === 'PROFIT_LOSS' && yearHeaders.length > 0 && firstCell && row[1] !== undefined) {
          const values = row.slice(1, yearHeaders.length + 1).map(cell => this.parseCell(cell));
          // Always process P&L data, even if all zeros (complete data integrity)
          this.addDataToSection(result.profitAndLoss, firstCell, yearHeaders, values);
        }

        // Track section changes
        if (firstCell.includes('PROFIT & LOSS')) {
          currentSection = 'PROFIT_LOSS';
          console.log('🔄 Entered PROFIT & LOSS section');
          continue;
        }

        if (firstCell.includes('Quarters')) {
          currentSection = 'QUARTERS';
          console.log('🔄 Entered Quarters section');
          continue;
        }

        if (firstCell.includes('BALANCE SHEET')) {
          currentSection = 'BALANCE_SHEET';
          balanceSheetHeaders = yearHeaders; // Use same year headers
          console.log('🔄 Entered Balance Sheet section');
          continue;
        }

        // Parse Balance Sheet rows (only when in BALANCE_SHEET section)
        if (currentSection === 'BALANCE_SHEET' && balanceSheetHeaders.length > 0 && firstCell && row[1] !== undefined) {
          const values = row.slice(1, balanceSheetHeaders.length + 1).map(cell => this.parseCell(cell));
          // Always process Balance Sheet data, even if all zeros (complete data integrity)
          this.addDataToSection(result.balanceSheet, firstCell, balanceSheetHeaders, values);
        }

        if (firstCell.includes('CASH FLOW')) {
          currentSection = 'CASH_FLOW';
          cashFlowHeaders = yearHeaders; // Use same year headers
          console.log('🔄 Entered Cash Flow section');
          continue;
        }

        // Parse Cash Flow rows (only when in CASH_FLOW section)
        if (currentSection === 'CASH_FLOW' && cashFlowHeaders.length > 0 && firstCell && row[1] !== undefined) {
          const values = row.slice(1, cashFlowHeaders.length + 1).map(cell => this.parseCell(cell));
          // Always process Cash Flow data, even if all zeros (complete data integrity)
          this.addDataToSection(result.cashFlow, firstCell, cashFlowHeaders, values);
        }

        // Parse quarterly data (only when in QUARTERS section)
        if (currentSection === 'QUARTERS' && quarterHeaders.length > 0 && firstCell && row[1] !== undefined) {
          const values = row.slice(1, quarterHeaders.length + 1).map(cell => this.parseCell(cell));
          // Always process Quarterly data, even if all zeros (complete data integrity)
          this.addQuarterlyData(result.quarterlyData, firstCell, quarterHeaders, values);
        }

        // Handle price data
        if (firstCell.includes('PRICE') && row[1]) {
          const priceValues = row.slice(1, yearHeaders.length + 1).map(cell => parseFloat(cell) || 0);
          if (priceValues.length > 0) {
            result.priceData = yearHeaders.map((year, index) => ({
              year,
              value: priceValues[index] || 0
            })).filter(item => item.value > 0);
          }
        }
      }

      console.log('✅ Excel parsing completed');
      console.log('📋 Company:', result.meta.companyName);
      console.log('💰 Current Price:', result.meta.currentPrice);
      console.log('📈 Market Cap:', result.meta.marketCapitalization);

      return result;

    } catch (error) {
      console.error('❌ Error parsing Excel file:', error);
      return null;
    }
  }

  private static addDataToSection(section: any, fieldName: string, headers: string[], values: number[]) {
    const fieldMap: { [key: string]: string } = {
      // Profit & Loss fields (with exact Excel field names including spaces)
      ' Sales ': 'sales',
      'Sales': 'sales',
      ' Raw Material Cost ': 'rawMaterialCost',
      'Raw Material Cost': 'rawMaterialCost',
      ' Change in Inventory ': 'changeInInventory',
      'Change in Inventory': 'changeInInventory',
      ' Power and Fuel ': 'powerAndFuel',
      'Power and Fuel': 'powerAndFuel',
      ' Other Mfr. Exp ': 'otherMfrExp',
      'Other Mfr. Exp': 'otherMfrExp',
      ' Employee Cost ': 'employeeCost',
      'Employee Cost': 'employeeCost',
      ' Selling and admin ': 'sellingAndAdmin',
      'Selling and admin': 'sellingAndAdmin',
      ' Other Expenses ': 'otherExpenses',
      'Other Expenses': 'otherExpenses',
      ' Other Income ': 'otherIncome',
      'Other Income': 'otherIncome',
      ' Depreciation ': 'depreciation',
      'Depreciation': 'depreciation',
      ' Interest ': 'interest',
      'Interest': 'interest',
      ' Profit before tax ': 'profitBeforeTax',
      'Profit before tax': 'profitBeforeTax',
      ' Tax ': 'tax',
      'Tax': 'tax',
      ' Net profit ': 'netProfit',
      'Net profit': 'netProfit',
      ' Dividend Amount ': 'dividendAmount',
      'Dividend Amount': 'dividendAmount',

      // Balance Sheet fields (with exact Excel field names including spaces)
      ' Equity Share Capital ': 'equityShareCapital',
      'Equity Share Capital': 'equityShareCapital',
      ' Reserves ': 'reserves',
      'Reserves': 'reserves',
      ' Borrowings ': 'borrowings',
      'Borrowings': 'borrowings',
      ' Other Liabilities ': 'otherLiabilities',
      'Other Liabilities': 'otherLiabilities',
      ' Total ': 'total',
      'Total': 'total',
      ' Net Block ': 'netBlock',
      'Net Block': 'netBlock',
      ' Capital Work in Progress ': 'capitalWorkInProgress',
      'Capital Work in Progress': 'capitalWorkInProgress',
      ' Investments ': 'investments',
      'Investments': 'investments',
      ' Other Assets ': 'otherAssets',
      'Other Assets': 'otherAssets',
      ' Receivables ': 'receivables',
      'Receivables': 'receivables',
      ' Inventory ': 'inventory',
      'Inventory': 'inventory',
      ' Cash & Bank ': 'cashAndBank',
      'Cash & Bank': 'cashAndBank',
      ' No. of Equity Shares ': 'numberOfEquityShares',
      'No. of Equity Shares': 'numberOfEquityShares',
      ' New Bonus Shares ': 'newBonusShares',
      'New Bonus Shares': 'newBonusShares',
      ' Face value ': 'faceValue',
      'Face value': 'faceValue',
      ' Adjusted Equity Shares in Cr ': 'adjustedEquityShares',
      'Adjusted Equity Shares in Cr': 'adjustedEquityShares',

      // Cash Flow fields (with exact Excel field names including spaces)
      ' Cash from Operating Activity ': 'cashFromOperatingActivity',
      'Cash from Operating Activity': 'cashFromOperatingActivity',
      ' Cash from Investing Activity ': 'cashFromInvestingActivity',
      'Cash from Investing Activity': 'cashFromInvestingActivity',
      ' Cash from Financing Activity ': 'cashFromFinancingActivity',
      'Cash from Financing Activity': 'cashFromFinancingActivity',
      ' Net Cash Flow ': 'netCashFlow',
      'Net Cash Flow': 'netCashFlow'
    };

    const mappedField = fieldMap[fieldName];
    if (mappedField && section[mappedField] !== undefined) {
      // Keep complete data integrity - preserve all values including zeros
      section[mappedField] = headers.map((year, index) => ({
        year,
        value: values[index] || 0
      }));
    }
  }

  private static addQuarterlyData(section: any, fieldName: string, headers: string[], values: number[]) {
    const fieldMap: { [key: string]: string } = {
      'Sales': 'sales',
      'Expenses': 'expenses',
      'Other Income': 'otherIncome',
      'Depreciation': 'depreciation',
      'Interest': 'interest',
      'Profit before tax': 'profitBeforeTax',
      'Tax': 'tax',
      'Net profit': 'netProfit',
      'Operating Profit': 'operatingProfit'
    };

    const mappedField = fieldMap[fieldName];
    if (mappedField && section[mappedField] !== undefined) {
      // Don't filter out zero values - keep complete data integrity
      section[mappedField] = headers.map((quarter, index) => ({
        quarter,
        value: values[index] || 0
      }));
    }
  }
}