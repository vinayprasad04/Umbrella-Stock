# Stock News Fetching System - Setup Guide

## Overview

This system fetches stock news/announcements from **Screener.in** and stores them in the MongoDB `StockActivity` collection. It was set up to replace the previous Tickertape API approach which had limited coverage.

## Key Components

### 1. Database Schema Updates

**EquityStock Model** ([lib/models/EquityStock.ts:16-17](lib/models/EquityStock.ts#L16-L17))

Added two new optional fields to store Screener.in metadata:
- `screenerSlug`: Slug from Screener.in (e.g., "/stocks/reliance-industries-RELI")
- `screenerId`: Stock ID from Screener.in (e.g., "RELI")

**Note:** These fields were added for future reference, but the current implementation uses stock symbols directly via the `/company/SYMBOL/` URL format.

### 2. Scripts

#### Import Screener Slugs (One-time Setup)
**File:** `scripts/import-screener-slugs.js`

This script imports slug metadata from the `stockData.json` file you provided into the database.

```bash
npm run import-screener-slugs
```

**Status:** Successfully imported 500 stocks' metadata.

#### Sync News from Screener.in
**File:** `scripts/sync-stock-news-screener.js`

Main production script that:
- Fetches active stocks from the database
- Scrapes announcements from Screener.in using the format: `https://www.screener.in/company/SYMBOL/`
- Parses the HTML to extract announcements
- Saves news to the `StockActivity` collection

**Configuration:**
- Batch size: 10 stocks at a time
- Delay between batches: 3 seconds
- Delay between individual requests: 1 second
- Max news for stocks WITHOUT existing news: 50 (fetches comprehensive history)
- Max news for stocks WITH existing news: 20 (fetches latest only)

**Smart Incremental Sync:**
The script intelligently determines which stocks need full history vs. incremental updates:
- **Stocks without news:** Fetches up to 50 announcements to build initial history
- **Stocks with existing news:** Fetches up to 20 latest announcements and stops when it hits a duplicate (efficient incremental update)

```bash
npm run sync-news-screener
```

#### Test Script
**File:** `scripts/sync-news-screener-test.js`

A limited version that tests only 10 stocks to verify the scraping works correctly.

```bash
npm run sync-news-screener-test
```

**Test Results:**
- Initial test: Successfully fetched 39 new announcements from 9 out of 10 stocks
- With incremental sync: Fetched 28 new announcements efficiently (stopped early when hitting duplicates)

## How It Works

### URL Structure

The script uses Screener.in's stock pages with this format:
```
https://www.screener.in/company/{STOCK_SYMBOL}/
```

Example: `https://www.screener.in/company/RELIANCE/`

### HTML Parsing

The script looks for the "Announcements" section on Screener.in pages:

1. Finds the `<h2>`, `<h3>`, or `<h4>` tag containing "Announcements"
2. Gets the next sibling element (usually a `div.show-more-box`)
3. Extracts all `<li>` elements within that container
4. For each announcement:
   - Extracts the headline from the link text
   - Extracts the source URL (usually BSE or NSE links)
   - Parses the date from various formats

### Date Formats Supported

The parser handles multiple date formats from Screener.in:

- **Relative dates:** "1d", "2d", "3d" (days ago)
- **Short dates:** "30 Sep", "23 Sep" (day + month)
- **Full dates:** "15 Jan 25" (day + month + year)

### Data Storage

News items are stored in the `StockActivity` collection with:
- `stockSymbol`: The stock ticker symbol (e.g., "RELIANCE")
- `activityType`: Set to "news-article"
- `headline`: The announcement headline
- `publishedAt`: Parsed date of the announcement
- `source`: "Screener.in"
- `sourceUrl`: Link to the original BSE/NSE document
- `feedType`: "news-article"
- `isActive`: true

### Duplicate Handling & Incremental Sync

The system uses a unique compound index to prevent duplicates:
```javascript
{ stockSymbol: 1, activityType: 1, headline: 1, publishedAt: 1 }
```

**Intelligent Early Stopping:**
- For stocks **without** existing news: All duplicates are skipped, continues to fetch all available news (up to 50)
- For stocks **with** existing news: When a duplicate is encountered, the script stops processing that stock immediately (since news is ordered newest first, hitting a duplicate means we've reached news we already have)

## Current Statistics

After setting up the system:
- **Total Active Stocks:** 2,142
- **Stocks WITH News:** 172 (8.03%)
- **Stocks WITHOUT News:** 1,970
- **Total News Articles:** 5,165

## Future Usage

### Running Periodic Sync

To keep news updated, you can:

1. **Manual run:**
   ```bash
   npm run sync-news-screener
   ```

2. **Scheduled cron job:**
   - **Linux/Mac:** Add to crontab
     ```bash
     0 2 * * * cd /path/to/project && npm run sync-news-screener
     ```
   - **Windows:** Use Task Scheduler
   - **Cloud:** Use Vercel Cron, GitHub Actions, or similar

### Recommended Schedule

Run the sync **once daily** (preferably after market hours) to fetch the latest announcements. The incremental sync feature makes daily runs very efficient:
- First run: Fetches up to 50 news items per stock
- Subsequent runs: Only fetches new announcements, stops early when duplicates are found

## Important Notes

1. **No Slug File Required in Future:** The system now uses stock symbols directly to build URLs, so you don't need to provide the `stockData.json` file again.

2. **Rate Limiting:** The script includes delays between requests to avoid overwhelming Screener.in. Adjust the `CONFIG` object in the script if needed.

3. **Error Handling:** Some stocks may return 404 errors if they're not available on Screener.in. These are logged but don't stop the entire sync process.

4. **Screener.in Structure Changes:** If Screener.in changes their HTML structure, the parser (`parseScreenerNews` function) may need to be updated.

## Troubleshooting

### No news found for a stock

- Verify the stock exists on Screener.in by visiting `https://www.screener.in/company/SYMBOL/`
- Check if the "Announcements" section exists on the page
- Run the test script with verbose logging to debug

### HTTP 404 Errors

Some stocks may not be available on Screener.in. This is normal and can be ignored.

### Duplicate detection not working

Check that the unique index exists on the `StockActivity` collection:
```javascript
db.stockactivities.getIndexes()
```

## Files Modified

1. [lib/models/EquityStock.ts](lib/models/EquityStock.ts) - Added screener fields
2. [scripts/import-screener-slugs.js](scripts/import-screener-slugs.js) - Import slugs (one-time)
3. [scripts/sync-stock-news-screener.js](scripts/sync-stock-news-screener.js) - Production sync script
4. [scripts/sync-news-screener-test.js](scripts/sync-news-screener-test.js) - Test script
5. [package.json](package.json) - Added npm scripts

## npm Scripts

```json
{
  "import-screener-slugs": "node scripts/import-screener-slugs.js",
  "sync-news-screener": "node scripts/sync-stock-news-screener.js",
  "sync-news-screener-test": "node scripts/sync-news-screener-test.js",
  "check-news-stats": "node scripts/check-news-stats.js"
}
```

---

**Setup Date:** October 11, 2025
**Status:** ✅ Fully functional and tested
