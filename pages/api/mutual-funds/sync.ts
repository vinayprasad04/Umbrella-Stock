import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import MutualFund from '@/lib/models/MutualFund';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Verify authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const decoded = AuthUtils.verifyAccessToken(token);
  
  if (!decoded || decoded.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  try {
    await connectDB();
    
    console.log('Starting mutual funds sync...');
    
    // Fetch all mutual funds from MFApi
    const response = await fetch('https://api.mfapi.in/mf', {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch mutual funds from MFApi');
    }
    
    const mutualFunds = await response.json();
    console.log(`Fetched ${mutualFunds.length} mutual funds from API`);
    
    // Process in batches to avoid memory issues
    const batchSize = 1000;
    let processed = 0;
    let upserted = 0;
    
    for (let i = 0; i < mutualFunds.length; i += batchSize) {
      const batch = mutualFunds.slice(i, i + batchSize);
      
      // Prepare bulk operations
      const bulkOps = batch.map((fund: any) => {
        // Extract fund house from scheme name
        let fundHouse = '';
        const schemeName = fund.schemeName.toLowerCase();
        
        if (schemeName.includes('aditya birla') || schemeName.includes('birla')) {
          fundHouse = 'Aditya Birla Sun Life';
        } else if (schemeName.includes('hdfc')) {
          fundHouse = 'HDFC';
        } else if (schemeName.includes('icici')) {
          fundHouse = 'ICICI Prudential';
        } else if (schemeName.includes('sbi')) {
          fundHouse = 'SBI';
        } else if (schemeName.includes('nippon')) {
          fundHouse = 'Nippon India';
        } else if (schemeName.includes('kotak')) {
          fundHouse = 'Kotak Mahindra';
        } else if (schemeName.includes('axis')) {
          fundHouse = 'Axis';
        } else if (schemeName.includes('franklin')) {
          fundHouse = 'Franklin Templeton';
        } else if (schemeName.includes('dsp')) {
          fundHouse = 'DSP';
        } else if (schemeName.includes('mirae')) {
          fundHouse = 'Mirae Asset';
        } else if (schemeName.includes('uti')) {
          fundHouse = 'UTI';
        } else if (schemeName.includes('tata')) {
          fundHouse = 'Tata';
        } else if (schemeName.includes('lic')) {
          fundHouse = 'LIC';
        } else if (schemeName.includes('quant')) {
          fundHouse = 'Quant';
        } else if (schemeName.includes('jm ')) {
          fundHouse = 'JM Financial';
        } else if (schemeName.includes('principal')) {
          fundHouse = 'Principal';
        } else if (schemeName.includes('invesco')) {
          fundHouse = 'Invesco';
        } else if (schemeName.includes('ppfas') || schemeName.includes('parag parikh')) {
          fundHouse = 'PPFAS';
        } else if (schemeName.includes('motilal oswal')) {
          fundHouse = 'Motilal Oswal';
        } else if (schemeName.includes('l&t') || schemeName.includes('l & t')) {
          fundHouse = 'L&T';
        } else if (schemeName.includes('quantum')) {
          fundHouse = 'Quantum';
        } else if (schemeName.includes('edelweiss')) {
          fundHouse = 'Edelweiss';
        } else if (schemeName.includes('mahindra manulife')) {
          fundHouse = 'Mahindra Manulife';
        } else if (schemeName.includes('canara robeco')) {
          fundHouse = 'Canara Robeco';
        } else if (schemeName.includes('union')) {
          fundHouse = 'Union';
        } else if (schemeName.includes('sundaram')) {
          fundHouse = 'Sundaram';
        } else if (schemeName.includes('baroda')) {
          fundHouse = 'Baroda BNP Paribas';
        } else {
          // Extract first part of scheme name as fallback
          const firstPart = fund.schemeName.split(' ')[0];
          fundHouse = firstPart;
        }
        
        // Determine category from scheme name
        let category = 'Others';
        if (schemeName.includes('large cap') || schemeName.includes('largecap')) {
          category = 'Large Cap';
        } else if (schemeName.includes('mid cap') || schemeName.includes('midcap')) {
          category = 'Mid Cap';
        } else if (schemeName.includes('small cap') || schemeName.includes('smallcap')) {
          category = 'Small Cap';
        } else if (schemeName.includes('flexi cap') || schemeName.includes('flexicap') || schemeName.includes('multi cap') || schemeName.includes('multicap')) {
          category = 'Flexi Cap';
        } else if (schemeName.includes('elss') || schemeName.includes('tax saver') || schemeName.includes('tax save')) {
          category = 'ELSS';
        } else if (schemeName.includes('index') || schemeName.includes('nifty') || schemeName.includes('sensex')) {
          category = 'Index Fund';
        } else if (schemeName.includes('debt') || schemeName.includes('bond') || schemeName.includes('gilt') || schemeName.includes('income') || schemeName.includes('duration')) {
          category = 'Debt';
        } else if (schemeName.includes('hybrid') || schemeName.includes('balanced') || schemeName.includes('equity & debt')) {
          category = 'Hybrid';
        } else if (schemeName.includes('liquid')) {
          category = 'Liquid';
        } else if (schemeName.includes('sectoral') || schemeName.includes('sector') || schemeName.includes('pharma') || schemeName.includes('technology') || schemeName.includes('banking') || schemeName.includes('fmcg') || schemeName.includes('infrastructure') || schemeName.includes('energy') || schemeName.includes('auto') || schemeName.includes('realty')) {
          category = 'Sectoral/Thematic';
        } else if (schemeName.includes('international') || schemeName.includes('global') || schemeName.includes('overseas') || schemeName.includes('nasdaq') || schemeName.includes('emerging')) {
          category = 'International';
        } else if (schemeName.includes('arbitrage')) {
          category = 'Arbitrage';
        } else if (schemeName.includes('equity') || schemeName.includes('growth') || schemeName.includes('value') || schemeName.includes('dividend') || schemeName.includes('focused') || schemeName.includes('opportunities') || schemeName.includes('bluechip')) {
          category = 'Equity';
        }
        
        return {
          updateOne: {
            filter: { schemeCode: fund.schemeCode },
            update: {
              $set: {
                schemeCode: fund.schemeCode,
                schemeName: fund.schemeName,
                isinGrowth: fund.isinGrowth,
                isinDivReinvestment: fund.isinDivReinvestment,
                fundHouse,
                category,
                lastUpdated: new Date(),
                isActive: true
              }
            },
            upsert: true
          }
        };
      });
      
      // Execute bulk operations
      const result = await MutualFund.bulkWrite(bulkOps);
      processed += batch.length;
      upserted += result.upsertedCount + result.modifiedCount;
      
      console.log(`Processed ${processed}/${mutualFunds.length} funds (${upserted} upserted)`);
    }
    
    // Mark inactive funds (funds that are no longer in the API)
    const activeSchemes = mutualFunds.map((fund: any) => fund.schemeCode);
    await MutualFund.updateMany(
      { schemeCode: { $nin: activeSchemes } },
      { $set: { isActive: false, lastUpdated: new Date() } }
    );
    
    console.log('Mutual funds sync completed successfully');
    
    res.status(200).json({
      success: true,
      data: {
        total: mutualFunds.length,
        processed,
        upserted,
        message: 'Mutual funds synced successfully'
      },
    });
  } catch (error) {
    console.error('Error syncing mutual funds:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to sync mutual funds data',
      code: 'SYNC_ERROR'
    });
  }
}