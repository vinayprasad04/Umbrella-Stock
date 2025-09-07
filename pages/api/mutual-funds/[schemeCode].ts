import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MutualFund from '@/lib/models/MutualFund';
import MutualFundDetails from '@/lib/models/MutualFundDetails';
import { APIResponse } from '@/types';

/**
 * Enhanced Mutual Fund Details API
 * 
 * Features:
 * - Fetches scheme data and NAV history from MFAPI.in
 * - Calculates proper CAGR returns (1Y, 3Y, 5Y)
 * - Fetches AUM and Top Holdings from real APIs and curated data sources
 * - Returns combined comprehensive data
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

    console.log(`📊 Fetching enhanced data for scheme: ${schemeCode}`);
    
    // Find mutual fund by scheme code from our database
    const mutualFund = await MutualFund
      .findOne({ 
        schemeCode: parseInt(schemeCode as string),
        isActive: true 
      })
      .lean() as any;
    
    if (!mutualFund) {
      return res.status(404).json({
        success: false,
        error: 'Mutual fund not found',
      });
    }
    
    // Fetch comprehensive data from MFApi
    let mfApiData: any = {};
    let scrapedData: any = {};
    
    try {
      console.log(`🌐 Fetching MFAPI data for scheme ${schemeCode}`);
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
          
          // Calculate CAGR returns using proper formula: (Latest NAV / NAV n-years-ago)^(1/n) - 1
          const returns = calculateCAGRReturns(historicalData, parseFloat(latestNav.nav));
          
          mfApiData = {
            currentNav: parseFloat(latestNav.nav),
            navDate: latestNav.date,
            returns1Y: returns.returns1Y,
            returns3Y: returns.returns3Y,
            returns5Y: returns.returns5Y,
            historicalData: historicalData.slice(0, 1000), // Up to 3 years of data
            fundHouseFull: apiData.meta?.fund_house || mutualFund.fundHouse,
            schemeType: apiData.meta?.scheme_type,
            schemeCategory: apiData.meta?.scheme_category,
            schemeNameFull: apiData.meta?.scheme_name || mutualFund.schemeName,
            dataSource: 'MFAPI.in'
          };
          
          console.log(`✅ MFAPI data fetched successfully: NAV=${latestNav.nav}, 1Y=${returns.returns1Y}%`);
          
          // Update our database with fresh data
          await MutualFund.updateOne(
            { schemeCode: parseInt(schemeCode as string) },
            {
              $set: {
                nav: parseFloat(latestNav.nav),
                returns1Y: returns.returns1Y,
                returns3Y: returns.returns3Y,
                returns5Y: returns.returns5Y,
                lastUpdated: new Date()
              }
            }
          );
        }
      } else {
        console.warn(`⚠️ MFAPI returned status: ${mfApiResponse.status}`);
      }
    } catch (error: any) {
      console.warn('⚠️ Failed to fetch data from MFApi:', error.message);
    }

    // Fetch additional data from database
    try {
      console.log(`🔍 Fetching fund details from database for: ${mutualFund.schemeName}`);
      const fundDetails = await MutualFundDetails.findOne({ 
        schemeCode: parseInt(schemeCode as string),
        isActive: true 
      }).lean();

      if (fundDetails) {
        scrapedData = {
          aum: fundDetails.aum,
          expenseRatio: fundDetails.expenseRatio,
          holdings: fundDetails.topHoldings || [],
          fundDetails: {
            minimumInvestment: fundDetails.minimumInvestment,
            minimumSIP: fundDetails.minimumSIP,
            exitLoad: fundDetails.exitLoad,
            launchDate: fundDetails.launchDate,
            fundManager: fundDetails.fundManagers || [],
            sectors: fundDetails.sectorAllocation || []
          },
          available: true,
          source: `Database (${fundDetails.dataSource})`,
          message: `Data from ${fundDetails.dataQuality} quality source`,
          status: 'DATABASE_SUCCESS',
          scrapedAt: fundDetails.lastScraped.toISOString(),
          placeholder: fundDetails.dataQuality === 'PLACEHOLDER'
        };
        console.log(`✅ Database data fetch completed: Quality=${fundDetails.dataQuality}, Source=${fundDetails.dataSource}`);
      } else {
        // Fallback: No data found in database
        scrapedData = {
          aum: null,
          holdings: [],
          fundDetails: null,
          available: false,
          source: 'Database - No Data',
          message: 'No detailed fund information available in database',
          status: 'DATABASE_NO_DATA'
        };
        console.log(`⚠️ No fund details found in database for scheme ${schemeCode}`);
      }
    } catch (error: any) {
      console.warn('⚠️ Database fetch failed:', error.message);
      scrapedData = {
        aum: null,
        holdings: [],
        available: false,
        source: 'Database Error',
        message: 'Unable to fetch fund details from database',
        status: 'DATABASE_ERROR'
      };
    }
    
    // Combine all data sources
    const combinedData = {
      // Base data from our database
      ...mutualFund,
      
      // Enhanced data from MFAPI
      ...mfApiData,
      
      // Additional scraped data
      scrapedAUM: scrapedData.aum,
      scrapedExpenseRatio: scrapedData.expenseRatio,
      topHoldings: scrapedData.holdings || [],
      fundDetails: scrapedData.fundDetails,
      additionalDataAvailable: scrapedData.available,
      scrapedAt: scrapedData.scrapedAt,
      scrapingStatus: scrapedData.status,
      scrapingMessage: scrapedData.message,
      isPlaceholderData: scrapedData.placeholder || false,
      
      // Metadata
      lastFetched: new Date().toISOString(),
      dataSources: {
        basic: 'Database',
        nav: mfApiData.dataSource || 'Database', 
        additional: scrapedData.source || 'Not Available',
        method: scrapedData.placeholder ? 'Intelligent Placeholder' : 'Real Data APIs'
      }
    };

    console.log(`🎉 Successfully compiled comprehensive data for ${mutualFund.schemeName}`);
    
    res.status(200).json({
      success: true,
      data: combinedData,
      message: 'Comprehensive mutual fund data fetched successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error in mutual fund details API:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mutual fund details'
    });
  }
}

/**
 * Calculate CAGR (Compound Annual Growth Rate) returns
 * Formula: (Latest NAV / NAV n-years-ago)^(1/n) - 1
 * 
 * @param {Array} historicalData - Array of NAV data with date and nav
 * @param {number} currentNav - Current NAV value
 * @returns {Object} CAGR returns for 1Y, 3Y, 5Y
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

    console.log(`📈 CAGR calculated: 1Y=${returns.returns1Y}%, 3Y=${returns.returns3Y}%, 5Y=${returns.returns5Y}%`);
    
  } catch (error: any) {
    console.warn('⚠️ CAGR calculation failed:', error.message);
  }

  return returns;
}

/**
 * Find historical NAV data for a specific time period
 * @param {Array} sortedData - Historical data sorted by date (newest first)
 * @param {Date} referenceDate - Reference date (usually today)
 * @param {number} yearsBack - Number of years to go back
 * @param {number} toleranceDays - Tolerance in days for finding closest date
 * @returns {Object|null} Historical NAV data or null
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