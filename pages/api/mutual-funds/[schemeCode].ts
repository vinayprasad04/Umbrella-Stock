import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MutualFund from '@/lib/models/MutualFund';
import { APIResponse } from '@/types';

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
    
    // Find mutual fund by scheme code
    const mutualFund = await MutualFund
      .findOne({ 
        schemeCode: parseInt(schemeCode as string),
        isActive: true 
      })
      .lean();
    
    if (!mutualFund) {
      return res.status(404).json({
        success: false,
        error: 'Mutual fund not found',
      });
    }
    
    // Fetch additional details from MFApi if needed
    let additionalData = {};
    try {
      const mfApiResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      if (mfApiResponse.ok) {
        const mfApiData = await mfApiResponse.json();
        
        if (mfApiData.data && mfApiData.data.length > 0) {
          const latestNav = mfApiData.data[0];
          const oneYearAgo = mfApiData.data.find((d: any) => {
            const date = new Date(d.date.split('-').reverse().join('-'));
            const yearAgo = new Date();
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return Math.abs(date.getTime() - yearAgo.getTime()) < 30 * 24 * 60 * 60 * 1000;
          });
          
          const threeYearAgo = mfApiData.data.find((d: any) => {
            const date = new Date(d.date.split('-').reverse().join('-'));
            const yearAgo = new Date();
            yearAgo.setFullYear(yearAgo.getFullYear() - 3);
            return Math.abs(date.getTime() - yearAgo.getTime()) < 30 * 24 * 60 * 60 * 1000;
          });
          
          const fiveYearAgo = mfApiData.data.find((d: any) => {
            const date = new Date(d.date.split('-').reverse().join('-'));
            const yearAgo = new Date();
            yearAgo.setFullYear(yearAgo.getFullYear() - 5);
            return Math.abs(date.getTime() - yearAgo.getTime()) < 30 * 24 * 60 * 60 * 1000;
          });
          
          // Calculate returns
          const returns1Y = oneYearAgo ? 
            ((parseFloat(latestNav.nav) - parseFloat(oneYearAgo.nav)) / parseFloat(oneYearAgo.nav)) * 100 : 
            null;
          
          const returns3Y = threeYearAgo ? 
            ((parseFloat(latestNav.nav) - parseFloat(threeYearAgo.nav)) / parseFloat(threeYearAgo.nav) / 3) * 100 : 
            null;
          
          const returns5Y = fiveYearAgo ? 
            ((parseFloat(latestNav.nav) - parseFloat(fiveYearAgo.nav)) / parseFloat(fiveYearAgo.nav) / 5) * 100 : 
            null;
          
          additionalData = {
            currentNav: parseFloat(latestNav.nav),
            navDate: latestNav.date,
            returns1Y: returns1Y ? Math.round(returns1Y * 100) / 100 : null,
            returns3Y: returns3Y ? Math.round(returns3Y * 100) / 100 : null,
            returns5Y: returns5Y ? Math.round(returns5Y * 100) / 100 : null,
            historicalData: mfApiData.data.slice(0, 365), // Last 1 year data
            fundHouseFull: mfApiData.meta?.fund_house,
            schemeType: mfApiData.meta?.scheme_type,
            schemeCategory: mfApiData.meta?.scheme_category,
            schemeNameFull: mfApiData.meta?.scheme_name
          };
          
          // Update our database with fresh data
          await MutualFund.updateOne(
            { schemeCode: parseInt(schemeCode as string) },
            {
              $set: {
                nav: parseFloat(latestNav.nav),
                returns1Y: returns1Y ? Math.round(returns1Y * 100) / 100 : null,
                returns3Y: returns3Y ? Math.round(returns3Y * 100) / 100 : null,
                returns5Y: returns5Y ? Math.round(returns5Y * 100) / 100 : null,
                lastUpdated: new Date()
              }
            }
          );
        }
      }
    } catch (error) {
      console.warn('Failed to fetch additional data from MFApi:', error);
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...mutualFund,
        ...additionalData
      },
    });
  } catch (error) {
    console.error('Error fetching mutual fund details:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mutual fund details',
      code: 'FETCH_ERROR'
    });
  }
}