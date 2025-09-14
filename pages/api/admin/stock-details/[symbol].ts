import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EquityStock from '@/lib/models/EquityStock';
import ActualEquityStockDetails from '@/lib/models/ActualEquityStockDetails';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

interface StockDetailsResponse {
  stock: any;
  actualData?: any;
  parsedStockDetail?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<StockDetailsResponse | any>>
) {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Symbol is required',
    });
  }

  // Verify JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);

    if (!decoded || !['ADMIN', 'DATA_ENTRY'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await connectDB();

    if (req.method === 'GET') {
      // Fetch stock data
      const stock = await EquityStock.findOne({
        symbol: symbol.toUpperCase(),
        isActive: true
      }).lean();

      if (!stock) {
        return res.status(404).json({
          success: false,
          error: 'Stock not found',
        });
      }

      // Fetch actual data if exists (old format)
      const actualData = await ActualEquityStockDetails.findOne({
        symbol: symbol.toUpperCase(),
        isActive: true
      }).lean();

      // Fetch parsed stock detail data (new format with Excel data)
      const parsedStockDetail = await ActualStockDetail.findOne({
        symbol: symbol.toUpperCase(),
        isActive: true
      }).lean();

      return res.status(200).json({
        success: true,
        data: {
          stock,
          actualData,
          parsedStockDetail
        },
        message: 'Stock details retrieved successfully'
      });

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save/Update stock actual data
      const {
        sector,
        industry,
        marketCap,
        currentPrice,
        exchange,
        dataQuality,
        pe,
        pb,
        roe,
        dividendYield,
        bookValue,
        eps,
        revenue,
        profit,
        netWorth,
        description,
        website,
        managementTeam,
        keyMetrics
      } = req.body;

      if (!sector) {
        return res.status(400).json({
          success: false,
          error: 'Sector is required',
        });
      }

      // Check if stock exists
      const stock = await EquityStock.findOne({
        symbol: symbol.toUpperCase(),
        isActive: true
      });

      if (!stock) {
        return res.status(404).json({
          success: false,
          error: 'Stock not found',
        });
      }

      // Prepare data for save
      const stockData = {
        symbol: symbol.toUpperCase(),
        sector,
        industry,
        marketCap: marketCap ? parseFloat(marketCap) : undefined,
        currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
        exchange: exchange || 'NSE',
        dataQuality: dataQuality || 'PENDING_VERIFICATION',
        enteredBy: decoded.email,
        isActive: true,
        lastUpdated: new Date(),
        pe: pe ? parseFloat(pe) : undefined,
        pb: pb ? parseFloat(pb) : undefined,
        roe: roe ? parseFloat(roe) : undefined,
        dividendYield: dividendYield ? parseFloat(dividendYield) : undefined,
        bookValue: bookValue ? parseFloat(bookValue) : undefined,
        eps: eps ? parseFloat(eps) : undefined,
        revenue: revenue ? parseFloat(revenue) : undefined,
        profit: profit ? parseFloat(profit) : undefined,
        netWorth: netWorth ? parseFloat(netWorth) : undefined,
        description,
        website,
        managementTeam: Array.isArray(managementTeam) ? managementTeam.filter(m => m.trim()) : [],
        keyMetrics: {
          debtToEquity: keyMetrics?.debtToEquity ? parseFloat(keyMetrics.debtToEquity) : undefined,
          currentRatio: keyMetrics?.currentRatio ? parseFloat(keyMetrics.currentRatio) : undefined,
          quickRatio: keyMetrics?.quickRatio ? parseFloat(keyMetrics.quickRatio) : undefined,
          returnOnAssets: keyMetrics?.returnOnAssets ? parseFloat(keyMetrics.returnOnAssets) : undefined,
          returnOnEquity: keyMetrics?.returnOnEquity ? parseFloat(keyMetrics.returnOnEquity) : undefined,
          profitMargin: keyMetrics?.profitMargin ? parseFloat(keyMetrics.profitMargin) : undefined,
          operatingMargin: keyMetrics?.operatingMargin ? parseFloat(keyMetrics.operatingMargin) : undefined,
        }
      };

      // Remove undefined values from keyMetrics
      Object.keys(stockData.keyMetrics).forEach(key => {
        if (stockData.keyMetrics[key as keyof typeof stockData.keyMetrics] === undefined) {
          delete stockData.keyMetrics[key as keyof typeof stockData.keyMetrics];
        }
      });

      try {
        // Check if actual data already exists
        const existingActualData = await ActualEquityStockDetails.findOne({
          symbol: symbol.toUpperCase(),
          isActive: true
        });

        let savedData;
        if (existingActualData) {
          // Update existing
          savedData = await ActualEquityStockDetails.findOneAndUpdate(
            { symbol: symbol.toUpperCase(), isActive: true },
            stockData,
            { new: true, runValidators: true }
          );
        } else {
          // Create new
          savedData = await ActualEquityStockDetails.create(stockData);
        }

        return res.status(200).json({
          success: true,
          data: savedData,
          message: existingActualData ? 'Stock data updated successfully' : 'Stock data created successfully'
        });

      } catch (mongoError: any) {
        console.error('❌ MongoDB Error:', mongoError);

        if (mongoError.code === 11000) {
          return res.status(400).json({
            success: false,
            error: 'Stock data already exists',
          });
        }

        throw mongoError;
      }

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

  } catch (error: any) {
    console.error('❌ Error handling stock details:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation error: ${errors.join(', ')}`,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to process stock details',
    });
  }
}