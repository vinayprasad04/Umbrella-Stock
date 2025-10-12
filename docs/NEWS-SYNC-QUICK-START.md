# Stock News Sync - Quick Start Guide

## Overview

This system automatically fetches stock news/announcements from Screener.in and stores them in MongoDB.

## Quick Commands

### Run Full Sync (All Stocks)
```bash
npm run sync-news-screener
```

### Test with 10 Stocks
```bash
npm run sync-news-screener-test
```

### Check Current Statistics
```bash
npm run check-news-stats
```

## How It Works

### Intelligent Sync Strategy

The system automatically adapts based on whether a stock has existing news:

| Stock Type | Max News | Behavior |
|-----------|----------|----------|
| **NEW** (no existing news) | 50 items | Fetches comprehensive history |
| **EXISTING** (has news) | 20 items | Fetches latest, stops at first duplicate |

### Performance

- **Batch Size:** 10 stocks per batch
- **Delays:** 1s between stocks, 3s between batches
- **Efficiency:** Stocks with existing news stop early when duplicates are found

## Example Output

```
🔍 Checking which stocks already have news...
   📰 Stocks with existing news: 172 (will fetch up to 20 latest)
   🆕 Stocks without news: 1970 (will fetch up to 50)

📦 Processing batch 1/215 (10 stocks)...
  ✅ BSOFT (🔄 update): +2 new, 1 skipped
  ✅ TATACOMM (🔄 update): +4 new, 1 skipped
  ✅ NEWSTOCK (🆕 new): +47 new, 0 skipped
```

## Scheduling

### Daily Cron Job (Linux/Mac)
```bash
# Run at 2 AM daily
0 2 * * * cd /path/to/project && npm run sync-news-screener
```

### Windows Task Scheduler
1. Create new task
2. Trigger: Daily at 2 AM
3. Action: `npm run sync-news-screener`

### Vercel Cron
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync-news",
    "schedule": "0 2 * * *"
  }]
}
```

## Current Status

- **Active Stocks:** 2,142
- **Stocks with News:** 172 (8.03%)
- **Total News Articles:** 5,165+
- **Source:** Screener.in

## Troubleshooting

### No news found for some stocks
- Normal - not all stocks are available on Screener.in
- Check manually: `https://www.screener.in/company/SYMBOL/`

### Getting 404 errors
- Stock may not be listed on Screener.in
- These errors are logged but don't stop the sync

### Too slow
- Adjust `CONFIG.batchSize` in the script (max recommended: 20)
- Reduce `CONFIG.delayBetweenRequests` (min: 500ms)

## What Gets Synced

✅ Corporate announcements
✅ Board meeting intimations
✅ Financial results
✅ Dividend announcements
✅ Regulatory filings
✅ Press releases

## Database Schema

News is stored in `StockActivity` collection:
- `stockSymbol`: Stock ticker (e.g., "RELIANCE")
- `headline`: Announcement headline
- `publishedAt`: Date of announcement
- `sourceUrl`: Link to BSE/NSE document
- `source`: "Screener.in"

---

**For detailed technical documentation, see:** [STOCK-NEWS-SETUP.md](STOCK-NEWS-SETUP.md)

**Last Updated:** October 11, 2025
