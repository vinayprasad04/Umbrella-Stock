import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EquityStock from '@/lib/models/EquityStock';
import { APIResponse } from '@/types';
import { AuthUtils } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

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
    
    console.log('Starting equity stocks CSV import...');
    
    // Path to the CSV file
    const csvFilePath = 'c:/Users/QSS/Downloads/EQUITY_L.csv';
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at: ${csvFilePath}`);
    }
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n');
    
    if (lines.length <= 1) {
      throw new Error('CSV file is empty or has no data rows');
    }
    
    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    console.log('CSV Headers:', header);
    
    // Process data rows
    const stocks = [];
    let processed = 0;
    let skipped = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      try {
        const values = line.split(',');
        if (values.length < 8) {
          console.warn(`Skipping row ${i}: insufficient columns`);
          skipped++;
          continue;
        }
        
        // Parse date string (DD-MMM-YYYY format)
        const dateStr = values[3].trim();
        const dateParts = dateStr.split('-');
        if (dateParts.length !== 3) {
          console.warn(`Skipping row ${i}: invalid date format ${dateStr}`);
          skipped++;
          continue;
        }
        
        const monthMap: { [key: string]: number } = {
          'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
          'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
        };
        
        const day = parseInt(dateParts[0]);
        const month = monthMap[dateParts[1].toUpperCase()];
        const year = parseInt(dateParts[2]);
        
        if (isNaN(day) || month === undefined || isNaN(year)) {
          console.warn(`Skipping row ${i}: invalid date components ${dateStr}`);
          skipped++;
          continue;
        }
        
        const dateOfListing = new Date(year, month, day);
        
        const stock = {
          symbol: values[0].trim().toUpperCase(),
          companyName: values[1].trim(),
          series: values[2].trim().toUpperCase(),
          dateOfListing,
          paidUpValue: parseFloat(values[4].trim()) || 0,
          marketLot: parseInt(values[5].trim()) || 1,
          isinNumber: values[6].trim(),
          faceValue: parseFloat(values[7].trim()) || 0,
          isActive: true,
          lastUpdated: new Date()
        };
        
        // Validate required fields
        if (!stock.symbol || !stock.companyName || !stock.isinNumber) {
          console.warn(`Skipping row ${i}: missing required fields`);
          skipped++;
          continue;
        }
        
        stocks.push(stock);
        processed++;
        
      } catch (error) {
        console.warn(`Error processing row ${i}:`, error);
        skipped++;
      }
    }
    
    console.log(`Processed ${processed} stocks, skipped ${skipped} rows`);
    
    if (stocks.length === 0) {
      throw new Error('No valid stocks found in CSV file');
    }
    
    // Process in batches to avoid memory issues
    const batchSize = 1000;
    let inserted = 0;
    let updated = 0;
    
    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize);
      
      // Prepare bulk operations
      const bulkOps = batch.map((stock) => ({
        updateOne: {
          filter: { symbol: stock.symbol },
          update: {
            $set: stock
          },
          upsert: true
        }
      }));
      
      // Execute bulk operations
      const result = await EquityStock.bulkWrite(bulkOps);
      inserted += result.upsertedCount;
      updated += result.modifiedCount;
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stocks.length / batchSize)} (${inserted} inserted, ${updated} updated)`);
    }
    
    console.log('Equity stocks CSV import completed successfully');
    
    res.status(200).json({
      success: true,
      data: {
        totalProcessed: processed,
        totalSkipped: skipped,
        totalInserted: inserted,
        totalUpdated: updated,
        message: 'Equity stocks imported successfully'
      },
    });
  } catch (error) {
    console.error('Error importing equity stocks CSV:', error);
    
    res.status(500).json({
      success: false,
      error: `Failed to import equity stocks: ${(error as Error).message}`,
      code: 'CSV_IMPORT_ERROR'
    });
  }
}