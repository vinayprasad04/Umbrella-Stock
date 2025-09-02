# Mutual Fund Data Synchronization

This directory contains scripts for syncing mutual fund data from external APIs to the local MongoDB database.

## sync-mutual-funds.js

Comprehensive script that fetches and synchronizes mutual fund data from AMFI and MFAPI.

### What it does:

1. **Fetches AMFI Data**: Downloads the latest NAV data from `https://www.amfiindia.com/spages/NAVAll.txt`
2. **Parses Schemes**: Extracts scheme codes, names, fund houses, and ISIN numbers
3. **Enriches with MFAPI**: For each scheme, fetches additional details from `https://api.mfapi.in/mf/{schemeCode}`
4. **Calculates Returns**: Computes 1Y, 3Y, and 5Y returns from historical NAV data
5. **Updates Database**: Upserts all data into MongoDB `mutualfunds` collection

### Usage:

```bash
# Run the sync script
npm run sync-mutual-funds

# Or run directly with Node.js
node scripts/sync-mutual-funds.js
```

### Features:

- **Rate Limited**: 200ms delay between API calls to avoid rate limits
- **Batch Processing**: Processes schemes in batches of 50
- **Error Handling**: Gracefully handles API failures and continues
- **Progress Tracking**: Shows real-time progress and statistics
- **Database Indexes**: Automatically creates necessary indexes
- **Upsert Logic**: Updates existing records or inserts new ones

### Environment Variables:

Ensure `MONGODB_CONNECTION_URI` is set in your `.env.local` file:

```env
MONGODB_CONNECTION_URI=mongodb+srv://user:password@cluster.mongodb.net/umbrella-stock
```

### Expected Output:

```
🚀 Starting Mutual Fund Data Synchronization...

🔌 Connecting to MongoDB...
✅ Connected to MongoDB successfully
✅ Database indexes ensured

📥 Fetching AMFI NAV data...
✅ AMFI data fetched successfully

📋 Parsing AMFI NAV data...
✅ Parsed 40,000+ schemes from AMFI data

🔄 Processing 40,000+ schemes in batches of 50...

📦 Processing batch 1/800 (50 schemes)
⏳ Progress: 50/40000 (0.1%) | Success: 48 | Errors: 2

...

✅ Processing completed!
📊 Total processed: 40000
✅ Successful: 39500
❌ Errors: 500

🎉 Mutual fund data synchronization completed successfully!
🔌 MongoDB connection closed
```

### Notes:

- **Run Time**: Expect 3-4 hours for full sync (40,000+ schemes with 200ms delay)
- **Partial Failures**: Script continues even if some schemes fail
- **Data Quality**: MFAPI may not have data for all schemes
- **Memory Usage**: Processes in batches to manage memory efficiently

### Troubleshooting:

1. **MongoDB Connection Issues**: Check your connection string in `.env.local`
2. **AMFI Site Down**: The script will fail if AMFI website is unavailable
3. **Rate Limiting**: Increase `REQUEST_DELAY` if getting too many API errors
4. **Memory Issues**: Reduce `BATCH_SIZE` if running out of memory