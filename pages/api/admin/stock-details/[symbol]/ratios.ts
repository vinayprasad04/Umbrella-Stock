import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>
) {
  await connectDB();

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = AuthUtils.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
      });
    }

    if (req.method === 'POST') {
      return handleSaveRatios(req, res, decoded, symbol.toUpperCase());
    } else if (req.method === 'GET') {
      return handleGetRatios(req, res, decoded, symbol.toUpperCase());
    } else if (req.method === 'DELETE') {
      return handleDeleteRatios(req, res, decoded, symbol.toUpperCase());
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }
  } catch (error: any) {
    console.error('❌ Ratios API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

async function handleSaveRatios(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>,
  decoded: any,
  symbol: string
) {
  try {
    const { ratios } = req.body;

    if (!ratios || typeof ratios !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Ratios data is required and must be an object',
      });
    }

    console.log('📊 Saving ratios for symbol:', symbol);
    console.log('📊 Ratios data:', ratios);

    // Find existing ActualStockDetail or create new one
    let stockDetail = await ActualStockDetail.findOne({ symbol });

    if (stockDetail) {
      // Update existing document
      stockDetail.ratios = ratios;
      stockDetail.lastUpdated = new Date();
      stockDetail.enteredBy = decoded.email || 'Admin';
      await stockDetail.save();

      console.log('✅ Updated existing ActualStockDetail with ratios');
    } else {
      // Create new document with minimal required fields
      stockDetail = new ActualStockDetail({
        symbol,
        companyName: symbol, // Will be updated when other data is added
        meta: {
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
        additionalInfo: {},
        ratios,
        dataQuality: 'PENDING_VERIFICATION',
        lastUpdated: new Date(),
        enteredBy: decoded.email || 'Admin',
        isActive: true
      });

      await stockDetail.save();
      console.log('✅ Created new ActualStockDetail with ratios');
    }

    // Count the number of ratios saved
    const ratioCount = Object.keys(ratios).length;

    return res.status(200).json({
      success: true,
      message: `Successfully saved ${ratioCount} ratios for ${symbol}`,
      data: {
        symbol,
        ratioCount,
        ratios: stockDetail.ratios
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving ratios:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to save ratios: ${error.message}`,
    });
  }
}

async function handleGetRatios(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>,
  decoded: any,
  symbol: string
) {
  try {
    const stockDetail = await ActualStockDetail.findOne({
      symbol,
      isActive: true
    }).select('ratios');

    if (!stockDetail || !stockDetail.ratios) {
      return res.status(404).json({
        success: false,
        error: 'No ratios found for this stock',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        symbol,
        ratios: stockDetail.ratios
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting ratios:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to get ratios: ${error.message}`,
    });
  }
}

async function handleDeleteRatios(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<any>>,
  decoded: any,
  symbol: string
) {
  try {
    const result = await ActualStockDetail.findOneAndUpdate(
      { symbol, isActive: true },
      {
        $unset: { ratios: 1 },
        lastUpdated: new Date(),
        enteredBy: decoded.email || 'Admin'
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
      });
    }

    console.log('🗑️ Deleted ratios for symbol:', symbol);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ratios for ${symbol}`,
      data: { symbol }
    });

  } catch (error: any) {
    console.error('❌ Error deleting ratios:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to delete ratios: ${error.message}`,
    });
  }
}