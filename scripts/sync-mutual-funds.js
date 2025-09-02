/**
 * Mutual Fund Data Synchronization Script
 * 
 * This script fetches mutual fund data from AMFI and MFAPI and syncs it to MongoDB.
 * 
 * Steps:
 * 1. Connect to local MongoDB (umbrella-stock database)
 * 2. Fetch latest scheme list from AMFI NAVAll.txt
 * 3. Parse NAV data and extract scheme details
 * 4. For each scheme, fetch additional data from MFAPI
 * 5. Upsert all data into MongoDB mutualfunds collection
 * 
 * Usage: node scripts/sync-mutual-funds.js
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_CONNECTION_URI || 'mongodb+srv://root:12345678901@cluster0.mihlqek.mongodb.net/umbrella-stock?retryWrites=true&w=majority';
const AMFI_NAV_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';
const MFAPI_BASE_URL = 'https://api.mfapi.in/mf';
const REQUEST_DELAY = 200; // 200ms delay between API calls
const BATCH_SIZE = 50; // Process schemes in batches

// MongoDB client
let mongoClient;
let db;

/**
 * Step 1: Connect to MongoDB
 */
async function connectToMongoDB() {
    console.log('🔌 Connecting to MongoDB...');
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db('umbrella-stock');
        console.log('✅ Connected to MongoDB successfully');
        
        // Clean up invalid documents and ensure indexes
        const collection = db.collection('mutualfunds');
        
        // First, clean up any documents with null or invalid schemeCode
        console.log('🧹 Cleaning up invalid documents...');
        const deleteResult = await collection.deleteMany({
            $or: [
                { schemeCode: null },
                { schemeCode: { $exists: false } },
                { schemeCode: { $type: "string" } },
                { schemeCode: { $lte: 0 } }
            ]
        });
        console.log(`✅ Removed ${deleteResult.deletedCount} invalid documents`);
        
        // Drop ALL existing indexes to avoid conflicts
        console.log('🔧 Dropping all existing indexes...');
        try {
            await collection.dropIndexes();
            console.log('✅ Dropped all existing indexes');
        } catch (error) {
            console.log('⚠️ No indexes to drop or drop failed:', error.message);
        }
        
        // Create fresh indexes
        console.log('🔨 Creating fresh indexes...');
        try {
            await collection.createIndex({ schemeCode: 1 }, { unique: true });
            console.log('✅ Created schemeCode unique index');
            
            await collection.createIndex({ schemeName: 'text', fundHouse: 'text' });
            console.log('✅ Created text search index');
            
            await collection.createIndex({ isActive: 1, lastUpdated: -1 });
            console.log('✅ Created query optimization index');
            
        } catch (error) {
            console.error('❌ Index creation failed:', error.message);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

/**
 * Step 2: Fetch and parse AMFI NAV data
 */
async function fetchAMFIData() {
    console.log('📥 Fetching AMFI NAV data...');
    try {
        const response = await axios.get(AMFI_NAV_URL, { 
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('✅ AMFI data fetched successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Failed to fetch AMFI data:', error.message);
        throw error;
    }
}

/**
 * Step 3: Parse NAV text data and extract scheme details
 */
function parseAMFIData(navText) {
    console.log('📋 Parsing AMFI NAV data...');
    
    const lines = navText.split('\n');
    const schemes = [];
    let currentFundHouse = '';
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and headers
        if (!trimmedLine || trimmedLine.includes('Scheme Code') || trimmedLine.includes('ISIN')) {
            continue;
        }
        
        // Check if this line is a fund house name (no semicolons, all caps typically)
        if (!trimmedLine.includes(';')) {
            // This is likely a fund house name
            const possibleFundHouse = trimmedLine.replace(/\s+/g, ' ').trim();
            if (possibleFundHouse.length > 3 && possibleFundHouse.length < 100) {
                currentFundHouse = possibleFundHouse;
            }
            continue;
        }
        
        // Parse scheme data (semicolon-separated)
        const parts = trimmedLine.split(';');
        if (parts.length >= 4) {
            const schemeCode = parseInt(parts[0]);
            const isinDiv = parts[1] || null;
            const isinGrowth = parts[2] || null;
            const schemeName = parts[3] || '';
            const nav = parts[4] ? parseFloat(parts[4]) : null;
            const navDate = parts[5] || null;
            
            // Validate scheme code
            if (isNaN(schemeCode) || schemeCode <= 0) {
                continue;
            }
            
            schemes.push({
                schemeCode,
                schemeName: schemeName.trim(),
                fundHouse: currentFundHouse,
                isinDiv: isinDiv !== '-' ? isinDiv : null,
                isinGrowth: isinGrowth !== '-' ? isinGrowth : null,
                nav,
                navDate,
                isActive: true,
                lastUpdated: new Date()
            });
        }
    }
    
    console.log(`✅ Parsed ${schemes.length} schemes from AMFI data`);
    return schemes;
}

/**
 * Step 4: Fetch additional data from MFAPI for a single scheme
 */
async function fetchMFAPIData(schemeCode) {
    try {
        const response = await axios.get(`${MFAPI_BASE_URL}/${schemeCode}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.data && response.data.meta) {
            const meta = response.data.meta;
            const data = response.data.data || [];
            
            let additionalInfo = {
                category: meta.scheme_category || meta.scheme_type || null,
                schemeType: meta.scheme_type || null,
                fundHouseFull: meta.fund_house || null
            };
            
            // Calculate returns if historical data is available
            if (data.length > 0) {
                const latestNav = data[0];
                const currentNav = parseFloat(latestNav.nav);
                
                // Find historical data points for returns calculation
                const oneYearAgo = findHistoricalNav(data, 365);
                const threeYearAgo = findHistoricalNav(data, 365 * 3);
                const fiveYearAgo = findHistoricalNav(data, 365 * 5);
                
                additionalInfo = {
                    ...additionalInfo,
                    nav: currentNav,
                    navDate: latestNav.date,
                    returns1Y: oneYearAgo ? calculateReturn(currentNav, parseFloat(oneYearAgo.nav)) : null,
                    returns3Y: threeYearAgo ? calculateAnnualizedReturn(currentNav, parseFloat(threeYearAgo.nav), 3) : null,
                    returns5Y: fiveYearAgo ? calculateAnnualizedReturn(currentNav, parseFloat(fiveYearAgo.nav), 5) : null
                };
            }
            
            return additionalInfo;
        }
        
        return {};
    } catch (error) {
        // Log error but don't throw - we'll continue with other schemes
        console.warn(`⚠️ Failed to fetch MFAPI data for scheme ${schemeCode}:`, error.message);
        return {};
    }
}

/**
 * Helper function to find historical NAV data
 */
function findHistoricalNav(data, daysBack) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);
    
    return data.find(item => {
        const itemDate = new Date(item.date.split('-').reverse().join('-'));
        const diffDays = Math.abs((targetDate - itemDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // Within 30 days of target
    });
}

/**
 * Helper function to calculate simple return percentage
 */
function calculateReturn(currentNav, historicalNav) {
    if (!currentNav || !historicalNav || historicalNav === 0) return null;
    return Math.round(((currentNav - historicalNav) / historicalNav * 100) * 100) / 100;
}

/**
 * Helper function to calculate annualized return percentage
 */
function calculateAnnualizedReturn(currentNav, historicalNav, years) {
    if (!currentNav || !historicalNav || historicalNav === 0) return null;
    const totalReturn = currentNav / historicalNav;
    const annualizedReturn = (Math.pow(totalReturn, 1/years) - 1) * 100;
    return Math.round(annualizedReturn * 100) / 100;
}

/**
 * Step 5: Add delay between API calls to avoid rate limiting
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Step 6: Upsert scheme data into MongoDB
 */
async function upsertScheme(scheme) {
    try {
        const collection = db.collection('mutualfunds');
        
        await collection.replaceOne(
            { schemeCode: scheme.schemeCode },
            scheme,
            { upsert: true }
        );
        
        return true;
    } catch (error) {
        console.error(`❌ Failed to upsert scheme ${scheme.schemeCode}:`, error.message);
        return false;
    }
}

/**
 * Step 7: Process schemes in batches with progress tracking
 */
async function processSchemes(schemes) {
    console.log(`🔄 Processing ${schemes.length} schemes in batches of ${BATCH_SIZE}...`);
    
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Process schemes in batches
    for (let i = 0; i < schemes.length; i += BATCH_SIZE) {
        const batch = schemes.slice(i, i + BATCH_SIZE);
        console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(schemes.length/BATCH_SIZE)} (${batch.length} schemes)`);
        
        for (const scheme of batch) {
            try {
                // Fetch additional data from MFAPI
                const additionalData = await fetchMFAPIData(scheme.schemeCode);
                
                // Merge AMFI data with MFAPI data
                const enrichedScheme = {
                    ...scheme,
                    ...additionalData
                };
                
                // Upsert to MongoDB
                const success = await upsertScheme(enrichedScheme);
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
                
                processedCount++;
                
                // Show progress every 10 schemes
                if (processedCount % 10 === 0 || processedCount === schemes.length) {
                    const progress = ((processedCount / schemes.length) * 100).toFixed(1);
                    console.log(`⏳ Progress: ${processedCount}/${schemes.length} (${progress}%) | Success: ${successCount} | Errors: ${errorCount}`);
                }
                
                // Add delay to avoid rate limiting
                await delay(REQUEST_DELAY);
                
            } catch (error) {
                console.error(`❌ Error processing scheme ${scheme.schemeCode}:`, error.message);
                errorCount++;
                processedCount++;
            }
        }
    }
    
    console.log(`\n✅ Processing completed!`);
    console.log(`📊 Total processed: ${processedCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
}

/**
 * Step 8: Main execution function with error handling
 */
async function main() {
    console.log('🚀 Starting Mutual Fund Data Synchronization...\n');
    
    try {
        // Step 1: Connect to MongoDB
        await connectToMongoDB();
        
        // Step 2: Fetch AMFI data
        const navText = await fetchAMFIData();
        
        // Step 3: Parse AMFI data
        const schemes = parseAMFIData(navText);
        
        if (schemes.length === 0) {
            console.log('❌ No schemes found in AMFI data. Exiting...');
            return;
        }
        
        // Step 4-7: Process schemes with MFAPI data and upsert to MongoDB
        await processSchemes(schemes);
        
        console.log('\n🎉 Mutual fund data synchronization completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Synchronization failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Step 9: Close MongoDB connection
        if (mongoClient) {
            await mongoClient.close();
            console.log('🔌 MongoDB connection closed');
        }
    }
}

// Execute the script
if (require.main === module) {
    main();
}

module.exports = {
    main,
    connectToMongoDB,
    fetchAMFIData,
    parseAMFIData,
    fetchMFAPIData,
    processSchemes
};