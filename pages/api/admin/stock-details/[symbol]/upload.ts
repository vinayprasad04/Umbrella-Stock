import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EquityStock from '@/lib/models/EquityStock';
import ActualStockDetail from '@/lib/models/ActualStockDetail';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import { ExcelParser } from '@/lib/utils/excelParser';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Parse the uploaded files
    const form = formidable({
      multiples: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB max file size
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const additionalInfo = {
      description: Array.isArray(fields.description) ? fields.description[0] : fields.description || '',
      website: Array.isArray(fields.website) ? fields.website[0] : fields.website || '',
      sector: Array.isArray(fields.sector) ? fields.sector[0] : fields.sector || '',
      industry: Array.isArray(fields.industry) ? fields.industry[0] : fields.industry || '',
      managementTeam: fields.managementTeam ?
        (Array.isArray(fields.managementTeam) ? fields.managementTeam : [fields.managementTeam])
        : []
    };

    // Get editable company name from form fields
    const editableCompanyName = Array.isArray(fields.companyName) ? fields.companyName[0] : fields.companyName;
    const updatedCompanyName = editableCompanyName || stock.companyName;


    const dataQuality = (Array.isArray(fields.dataQuality) ? fields.dataQuality[0] : fields.dataQuality) || 'PENDING_VERIFICATION';

    let parsedData: any = null;
    let uploadedFileInfo: any[] = [];

    // Process uploaded files
    if (files.files) {
      const fileArray = Array.isArray(files.files) ? files.files : [files.files];

      for (const file of fileArray) {
        if (!file.filepath) continue;

        const fileExtension = path.extname(file.originalFilename || '').toLowerCase();
        let fileType: 'excel' | 'pdf' | 'csv';

        if (['.xlsx', '.xls'].includes(fileExtension)) {
          fileType = 'excel';

          // Parse Excel file
          try {
            const fileBuffer = fs.readFileSync(file.filepath);
            const excelData = ExcelParser.parseStockExcel(fileBuffer);

            if (excelData) {
              parsedData = excelData;
              console.log('✅ Excel data parsed successfully');
            } else {
              console.warn('⚠️ Failed to parse Excel data');
            }
          } catch (error) {
            console.error('❌ Error parsing Excel file:', error);
          }
        } else if (fileExtension === '.pdf') {
          fileType = 'pdf';
        } else if (fileExtension === '.csv') {
          fileType = 'csv';
        } else {
          continue; // Skip unsupported file types
        }

        // Store file info
        uploadedFileInfo.push({
          fileName: file.originalFilename || 'unknown',
          fileType,
          fileSize: file.size || 0,
          uploadDate: new Date()
        });

        // Clean up temporary file
        try {
          fs.unlinkSync(file.filepath);
        } catch (error) {
          console.warn('Warning: Could not delete temporary file:', error);
        }
      }
    }

    // Prepare data for saving - use the status selected by the user
    const stockDetailData = {
      symbol: symbol.toUpperCase(),
      companyName: updatedCompanyName,
      additionalInfo,
      dataQuality: dataQuality as 'PENDING_VERIFICATION' | 'VERIFIED' | 'EXCELLENT' | 'GOOD',
      enteredBy: decoded.email,
      uploadedFiles: uploadedFileInfo,
      isActive: true,
      lastUpdated: new Date()
    };

    // Add parsed Excel data if available (only structured data, no raw sheet data)
    if (parsedData) {
      Object.assign(stockDetailData, {
        meta: parsedData.meta,
        profitAndLoss: parsedData.profitAndLoss,
        quarterlyData: parsedData.quarterlyData,
        balanceSheet: parsedData.balanceSheet,
        cashFlow: parsedData.cashFlow,
        priceData: parsedData.priceData
        // Note: sheetData removed as requested - only process Data Sheet, don't save raw sheet data
      });
    }

    // Save or update the actual stock detail
    const existingRecord = await ActualStockDetail.findOne({
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    let savedData;
    if (existingRecord) {
      // Update existing record
      savedData = await ActualStockDetail.findOneAndUpdate(
        { symbol: symbol.toUpperCase(), isActive: true },
        stockDetailData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new record
      savedData = await ActualStockDetail.create(stockDetailData);
    }

    // Update the EquityStock record to mark it as having actual data
    if (savedData) {
      const updateData: any = {
        hasActualData: true,
        lastUpdated: new Date()
      };

      // Update company name in EquityStock if it was changed
      if (editableCompanyName && editableCompanyName !== stock.companyName) {
        updateData.companyName = editableCompanyName;
      }

      await EquityStock.findOneAndUpdate(
        { symbol: symbol.toUpperCase(), isActive: true },
        updateData
      );
    }

    const companyNameUpdated = editableCompanyName && editableCompanyName !== stock.companyName;

    return res.status(200).json({
      success: true,
      data: {
        stockDetail: savedData,
        parsedExcelData: parsedData ? true : false,
        uploadedFiles: uploadedFileInfo.length,
        companyNameUpdated
      },
      message: `Stock data ${existingRecord ? 'updated' : 'created'} successfully${parsedData ? ' with Excel data parsed' : ''}${companyNameUpdated ? '. Company name updated' : ''}`
    });

  } catch (error: any) {
    console.error('❌ Error processing stock data upload:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation error: ${errors.join(', ')}`,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to process stock data upload',
    });
  }
}