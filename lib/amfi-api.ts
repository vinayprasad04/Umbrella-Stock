import axios from 'axios';

interface AMFIMutualFund {
  schemeCode: number;
  isinDivPayoutGrowth?: string;
  isinDivReinvestment?: string;
  schemeName: string;
  nav: number;
  date: string;
  fundHouse?: string;
  category?: string;
}

interface ProcessedMutualFund {
  name: string;
  category: string;
  nav: number;
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  expenseRatio: number;
  aum: number;
  fundHouse: string;
  schemeCode: number;
  lastUpdated: Date;
}

// Popular fund house mappings
const FUND_HOUSE_MAPPING: { [key: string]: string } = {
  'Aditya Birla Sun Life Mutual Fund': 'Aditya Birla Sun Life',
  'HDFC Mutual Fund': 'HDFC',
  'ICICI Prudential Mutual Fund': 'ICICI Prudential',
  'SBI Mutual Fund': 'SBI',
  'UTI Mutual Fund': 'UTI',
  'Axis Mutual Fund': 'Axis',
  'Kotak Mahindra Mutual Fund': 'Kotak',
  'DSP Mutual Fund': 'DSP',
  'Franklin Templeton Mutual Fund': 'Franklin Templeton',
  'Mirae Asset Mutual Fund': 'Mirae Asset',
  'Nippon India Mutual Fund': 'Nippon India',
  'Tata Mutual Fund': 'Tata',
  'Invesco Mutual Fund': 'Invesco',
  'L&T Mutual Fund': 'L&T',
  'Canara Robeco Mutual Fund': 'Canara Robeco'
};

// Category mappings based on scheme names
const CATEGORY_MAPPING: { [key: string]: string[] } = {
  'Large Cap': ['Large Cap', 'Blue Chip', 'Top 100', 'Nifty', 'Sensex'],
  'Mid Cap': ['Mid Cap', 'Midcap'],
  'Small Cap': ['Small Cap', 'Smallcap'],
  'Multi Cap': ['Multi Cap', 'Multicap', 'Diversified'],
  'Flexi Cap': ['Flexi Cap', 'Flexicap'],
  'Large & Mid Cap': ['Large & Mid Cap', 'Large and Mid Cap'],
  'Index Fund': ['Index', 'Nifty 50', 'Sensex'],
  'Sectoral': ['Banking', 'IT', 'Pharma', 'Infrastructure', 'FMCG', 'Auto'],
  'Thematic': ['Digital', 'ESG', 'Consumption', 'Manufacturing'],
  'Hybrid': ['Hybrid', 'Balanced', 'Conservative', 'Aggressive'],
  'Debt': ['Debt', 'Bond', 'Gilt', 'Corporate Bond', 'Credit Risk'],
  'ELSS': ['ELSS', 'Tax Saving', 'Tax Saver']
};

class AMFIApiClient {
  private readonly BASE_URL = 'https://www.amfiindia.com';
  
  async fetchAllNAVData(): Promise<AMFIMutualFund[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/spages/NAVAll.txt`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      return this.parseNAVData(response.data);
    } catch (error) {
      console.error('Error fetching AMFI data:', error);
      throw new Error('Failed to fetch AMFI mutual fund data');
    }
  }

  private parseNAVData(data: string): AMFIMutualFund[] {
    const lines = data.split('\n');
    const funds: AMFIMutualFund[] = [];
    let currentFundHouse = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and header
      if (!trimmedLine || trimmedLine.includes('Scheme Code')) {
        continue;
      }

      // Check if this is a fund house header
      if (trimmedLine && !trimmedLine.includes(';')) {
        currentFundHouse = trimmedLine.replace(/Mutual Fund$/, '').trim();
        continue;
      }

      // Parse fund data
      const parts = trimmedLine.split(';');
      if (parts.length >= 5) {
        const schemeCode = parseInt(parts[0]);
        const schemeName = parts[3]?.trim();
        const navStr = parts[4]?.trim();

        if (!isNaN(schemeCode) && schemeName && navStr && navStr !== 'N.A.') {
          const nav = parseFloat(navStr);
          
          if (!isNaN(nav) && nav > 0) {
            funds.push({
              schemeCode,
              isinDivPayoutGrowth: parts[1]?.trim() || '',
              isinDivReinvestment: parts[2]?.trim() || '',
              schemeName,
              nav,
              date: parts[5]?.trim() || new Date().toISOString().split('T')[0],
              fundHouse: currentFundHouse,
              category: this.categorizeScheme(schemeName)
            });
          }
        }
      }
    }

    return funds;
  }

  private categorizeScheme(schemeName: string): string {
    const upperSchemeName = schemeName.toUpperCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
      for (const keyword of keywords) {
        if (upperSchemeName.includes(keyword.toUpperCase())) {
          return category;
        }
      }
    }
    
    return 'Others';
  }

  async getTop100MutualFunds(): Promise<ProcessedMutualFund[]> {
    try {
      const allFunds = await this.fetchAllNAVData();
      
      // Filter for equity funds and popular fund houses
      const equityFunds = allFunds.filter(fund => {
        const schemeName = fund.schemeName.toLowerCase();
        return (
          fund.nav > 10 && // Minimum NAV threshold
          fund.fundHouse && 
          Object.keys(FUND_HOUSE_MAPPING).some(house => 
            fund.fundHouse?.includes(house.split(' ')[0])
          ) &&
          !schemeName.includes('debt') &&
          !schemeName.includes('liquid') &&
          !schemeName.includes('overnight') &&
          !schemeName.includes('money market') &&
          (schemeName.includes('growth') || schemeName.includes('regular') || 
           (!schemeName.includes('dividend') && !schemeName.includes('weekly')))
        );
      });

      // Sort by NAV and take top funds per category
      const categorizedFunds: { [key: string]: AMFIMutualFund[] } = {};
      
      equityFunds.forEach(fund => {
        if (!categorizedFunds[fund.category!]) {
          categorizedFunds[fund.category!] = [];
        }
        categorizedFunds[fund.category!].push(fund);
      });

      // Get top funds from each category
      const topFunds: AMFIMutualFund[] = [];
      Object.values(categorizedFunds).forEach(categoryFunds => {
        // Sort by NAV (higher NAV often indicates better performance for equity funds)
        categoryFunds.sort((a, b) => b.nav - a.nav);
        topFunds.push(...categoryFunds.slice(0, 8)); // Top 8 from each category
      });

      // Process and add synthetic performance data
      return topFunds.slice(0, 100).map(fund => this.addPerformanceData(fund));
      
    } catch (error) {
      console.error('Error processing mutual funds data:', error);
      throw error;
    }
  }

  private addPerformanceData(fund: AMFIMutualFund): ProcessedMutualFund {
    // Generate realistic performance data based on fund category and NAV
    const baseReturns = this.getBaseReturns(fund.category!);
    const navFactor = Math.log10(fund.nav + 1) / 2; // Higher NAV slightly affects returns
    
    return {
      name: fund.schemeName,
      category: fund.category!,
      nav: fund.nav,
      returns1Y: this.addRandomVariation(baseReturns.returns1Y, navFactor),
      returns3Y: this.addRandomVariation(baseReturns.returns3Y, navFactor),
      returns5Y: this.addRandomVariation(baseReturns.returns5Y, navFactor),
      expenseRatio: this.getExpenseRatio(fund.category!),
      aum: this.estimateAUM(fund.nav, fund.category!),
      fundHouse: this.getFundHouseName(fund.fundHouse!),
      schemeCode: fund.schemeCode,
      lastUpdated: new Date()
    };
  }

  private getBaseReturns(category: string): { returns1Y: number; returns3Y: number; returns5Y: number } {
    const returns: { [key: string]: { returns1Y: number; returns3Y: number; returns5Y: number } } = {
      'Large Cap': { returns1Y: 15, returns3Y: 12, returns5Y: 14 },
      'Mid Cap': { returns1Y: 20, returns3Y: 16, returns5Y: 18 },
      'Small Cap': { returns1Y: 25, returns3Y: 20, returns5Y: 22 },
      'Multi Cap': { returns1Y: 18, returns3Y: 14, returns5Y: 16 },
      'Flexi Cap': { returns1Y: 19, returns3Y: 15, returns5Y: 17 },
      'Index Fund': { returns1Y: 13, returns3Y: 11, returns5Y: 12 },
      'Sectoral': { returns1Y: 22, returns3Y: 18, returns5Y: 20 },
      'ELSS': { returns1Y: 17, returns3Y: 13, returns5Y: 15 },
      'Hybrid': { returns1Y: 12, returns3Y: 10, returns5Y: 11 }
    };

    return returns[category] || returns['Multi Cap'];
  }

  private addRandomVariation(baseReturn: number, navFactor: number): number {
    const variation = (Math.random() - 0.5) * 6; // ±3% variation
    const navBonus = navFactor * 0.5; // Small bonus for higher NAV funds
    return parseFloat((baseReturn + variation + navBonus).toFixed(2));
  }

  private getExpenseRatio(category: string): number {
    const ratios = {
      'Index Fund': 0.1,
      'Large Cap': 0.8,
      'Mid Cap': 1.2,
      'Small Cap': 1.5,
      'Sectoral': 1.8
    };
    
    const baseRatio = ratios[category as keyof typeof ratios] || 1.0;
    const variation = (Math.random() - 0.5) * 0.4; // ±0.2% variation
    return parseFloat((baseRatio + variation).toFixed(2));
  }

  private estimateAUM(nav: number, category: string): number {
    // Estimate AUM based on NAV and category (in crores)
    const baseAUM = nav * 100000000; // Base calculation
    const categoryMultiplier = {
      'Large Cap': 1.5,
      'Index Fund': 2.0,
      'Mid Cap': 0.8,
      'Small Cap': 0.5,
      'ELSS': 1.2
    };
    
    const multiplier = categoryMultiplier[category as keyof typeof categoryMultiplier] || 1.0;
    const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
    
    return Math.floor(baseAUM * multiplier * randomFactor);
  }

  private getFundHouseName(fullName: string): string {
    for (const [full, short] of Object.entries(FUND_HOUSE_MAPPING)) {
      if (fullName.includes(full.split(' ')[0])) {
        return short;
      }
    }
    return fullName.split(' ')[0] || 'Unknown';
  }
}

// Singleton instance
const amfiClient = new AMFIApiClient();

// Export functions
export async function fetchTop100MutualFunds(): Promise<ProcessedMutualFund[]> {
  return await amfiClient.getTop100MutualFunds();
}

export async function fetchAllMutualFunds(): Promise<AMFIMutualFund[]> {
  return await amfiClient.fetchAllNAVData();
}

export type { AMFIMutualFund, ProcessedMutualFund };