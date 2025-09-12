import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MutualFund from '@/lib/models/MutualFund';
import ActualMutualFundDetails from '@/lib/models/ActualMutualFundDetails';
import { APIResponse } from '@/types';

/**
 * Verified Mutual Fund Details API
 * 
 * This API checks if there's verified fund data entered from the admin dashboard.
 * If verified data exists (status = 'VERIFIED'), it returns the actual detailed data.
 * Otherwise, it returns the standard API data from the main endpoint.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    await connectDB();
    
    const { schemeCode } = req.query;
    
    if (!schemeCode) {
      return res.status(400).json({
        success: false,
        error: 'Scheme code is required',
      });
    }

    console.log(`🔍 Checking for verified data for scheme: ${schemeCode}`);
    
    // First, check if we have verified actual fund details
    const verifiedFundDetails = await ActualMutualFundDetails
      .findOne({ 
        schemeCode: parseInt(schemeCode as string),
        dataQuality: 'VERIFIED',
        isActive: true 
      })
      .lean() as any;
    
    if (verifiedFundDetails) {
      console.log(`✅ Found verified data for scheme ${schemeCode} - returning actual details`);
      
      // Get basic fund info for nav and returns
      const mutualFund = await MutualFund
        .findOne({ 
          schemeCode: parseInt(schemeCode as string),
          isActive: true 
        })
        .lean() as any;

      // Fetch latest NAV data from MFAPI
      let mfApiData: any = {};
      try {
        const mfApiResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (mfApiResponse.ok) {
          const apiData = await mfApiResponse.json();
          
          if (apiData.data && apiData.data.length > 0) {
            const historicalData = apiData.data;
            const latestNav = historicalData[0];
            
            // Calculate CAGR returns
            const returns = calculateCAGRReturns(historicalData, parseFloat(latestNav.nav));
            
            mfApiData = {
              currentNav: parseFloat(latestNav.nav),
              navDate: latestNav.date,
              returns1Y: returns.returns1Y,
              returns3Y: returns.returns3Y,
              returns5Y: returns.returns5Y,
              historicalData: historicalData.slice(0, 1000),
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch NAV data from MFApi');
      }
      
      // Transform verified data to match the mutual fund detail interface
      const transformedData = {
        // Basic fund info
        schemeCode: verifiedFundDetails.schemeCode,
        schemeName: verifiedFundDetails.schemeName,
        fundHouse: verifiedFundDetails.fundHouse,
        fundHouseFull: verifiedFundDetails.fundInfo?.nameOfAMC || verifiedFundDetails.fundHouse,
        category: mutualFund?.category || 'N/A',
        schemeCategory: mutualFund?.category || 'N/A',
        schemeType: mutualFund?.schemeType || 'N/A',
        schemeNameFull: verifiedFundDetails.schemeName,
        
        // NAV and returns from API
        ...mfApiData,
        nav: mfApiData.currentNav || mutualFund?.nav,
        
        // Verified actual data
        expenseRatio: verifiedFundDetails.expense,
        scrapedExpenseRatio: verifiedFundDetails.expense,
        aum: null, // We don't have AUM in the verified model yet
        scrapedAUM: null,
        
        // Fund details from verified data
        fundDetails: {
          minimumInvestment: null,
          minimumSIP: null,
          exitLoad: verifiedFundDetails.exitLoad,
          launchDate: verifiedFundDetails.launchDate,
          fundManager: verifiedFundDetails.actualFundManagers?.map((manager: any) => ({
            name: manager.name,
            experience: manager.experience,
            qualification: manager.education
          })) || [],
          sectors: verifiedFundDetails.sectorWiseHoldings?.map((sector: any) => ({
            sector: sector.sector,
            allocation: sector.fundPercentage
          })) || []
        },
        
        // Top holdings from verified data (transform equity holdings)
        topHoldings: verifiedFundDetails.topEquityHoldings?.map((holding: any) => ({
          company: holding.companyName,
          allocation: holding.assetsPercentage
        })) || [],
        
        // Additional verified details
        assetAllocation: verifiedFundDetails.assetAllocation,
        portfolioAggregates: verifiedFundDetails.portfolioAggregates,
        creditRating: verifiedFundDetails.creditRating,
        sectorWiseHoldings: verifiedFundDetails.sectorWiseHoldings,
        topEquityHoldings: verifiedFundDetails.topEquityHoldings,
        topDebtHoldings: verifiedFundDetails.topDebtHoldings,
        riskometer: verifiedFundDetails.riskometer,
        openEnded: verifiedFundDetails.openEnded,
        lockInPeriod: verifiedFundDetails.lockInPeriod,
        fundInfo: verifiedFundDetails.fundInfo,
        actualFundManagers: verifiedFundDetails.actualFundManagers,
        
        // ISIN data from basic fund
        isinGrowth: mutualFund?.isinGrowth,
        isinDivReinvestment: mutualFund?.isinDivReinvestment,
        
        // Metadata
        isVerifiedData: true,
        dataQuality: verifiedFundDetails.dataQuality,
        dataSource: verifiedFundDetails.dataSource,
        lastVerified: verifiedFundDetails.lastVerified,
        verifiedBy: verifiedFundDetails.verifiedBy,
        lastFetched: new Date().toISOString(),
        dataSources: {
          basic: 'Admin Dashboard - Verified',
          nav: 'MFAPI.in',
          additional: `Admin Entry (${verifiedFundDetails.dataSource})`,
          method: 'Verified Admin Data'
        }
      };
      
      return res.status(200).json({
        success: true,
        data: transformedData,
        message: 'Verified mutual fund data retrieved successfully'
      });
    } else {
      console.log(`ℹ️ No verified data found for scheme ${schemeCode} - falling back to standard API`);
      
      // Fall back to standard API call
      const baseUrl = req.headers.host?.includes('localhost') 
        ? `http://${req.headers.host}` 
        : `https://${req.headers.host}`;
        
      const response = await fetch(`${baseUrl}/api/mutual-funds/${schemeCode}`, {
        headers: {
          'User-Agent': req.headers['user-agent'] || 'Internal-API-Call'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch standard fund data: ${response.status}`);
      }
      
      const standardData = await response.json();
      
      if (standardData.success) {
        // Mark as non-verified data
        standardData.data.isVerifiedData = false;
        standardData.data.dataSources = {
          ...standardData.data.dataSources,
          method: 'Standard API Data (Not Verified)'
        };
        
        return res.status(200).json(standardData);
      } else {
        throw new Error(standardData.error || 'Failed to fetch standard fund data');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error in verified mutual fund API:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mutual fund details'
    });
  }
}

/**
 * Calculate CAGR (Compound Annual Growth Rate) returns
 * Formula: (Latest NAV / NAV n-years-ago)^(1/n) - 1
 */
function calculateCAGRReturns(historicalData: any[], currentNav: number) {
  const returns = {
    returns1Y: null as number | null,
    returns3Y: null as number | null,
    returns5Y: null as number | null
  };

  try {
    // Sort data by date (newest first)
    const sortedData = historicalData
      .map(item => ({
        ...item,
        parsedDate: new Date(item.date.split('-').reverse().join('-'))
      }))
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

    const today = new Date();

    // Find NAV data for different time periods (with 45-day tolerance)
    const oneYearAgo = findHistoricalNav(sortedData, today, 1, 45);
    const threeYearAgo = findHistoricalNav(sortedData, today, 3, 45);
    const fiveYearAgo = findHistoricalNav(sortedData, today, 5, 45);

    // Calculate CAGR for 1 Year
    if (oneYearAgo) {
      const pastNav = parseFloat(oneYearAgo.nav);
      if (pastNav > 0) {
        const cagr1Y = (Math.pow(currentNav / pastNav, 1/1) - 1) * 100;
        returns.returns1Y = Math.round(cagr1Y * 100) / 100;
      }
    }

    // Calculate CAGR for 3 Years
    if (threeYearAgo) {
      const pastNav = parseFloat(threeYearAgo.nav);
      if (pastNav > 0) {
        const cagr3Y = (Math.pow(currentNav / pastNav, 1/3) - 1) * 100;
        returns.returns3Y = Math.round(cagr3Y * 100) / 100;
      }
    }

    // Calculate CAGR for 5 Years
    if (fiveYearAgo) {
      const pastNav = parseFloat(fiveYearAgo.nav);
      if (pastNav > 0) {
        const cagr5Y = (Math.pow(currentNav / pastNav, 1/5) - 1) * 100;
        returns.returns5Y = Math.round(cagr5Y * 100) / 100;
      }
    }
    
  } catch (error: any) {
    console.warn('⚠️ CAGR calculation failed:', error.message);
  }

  return returns;
}

/**
 * Find historical NAV data for a specific time period
 */
function findHistoricalNav(sortedData: any[], referenceDate: Date, yearsBack: number, toleranceDays: number = 30) {
  const targetDate = new Date(referenceDate);
  targetDate.setFullYear(targetDate.getFullYear() - yearsBack);
  
  let closestNav = null;
  let closestDiff = Infinity;
  
  for (const item of sortedData) {
    const diffDays = Math.abs((targetDate.getTime() - item.parsedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= toleranceDays && diffDays < closestDiff) {
      closestNav = item;
      closestDiff = diffDays;
    }
  }
  
  return closestNav;
}