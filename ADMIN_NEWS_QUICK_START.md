# Admin News Panel - Quick Start Guide

## ✅ System Status

### Database
- ✅ 100 news articles stored
- ✅ 50 articles for INFY
- ✅ 50 articles for TCS

### APIs
- ✅ Public API working: `/api/stocks/[symbol]/activities`
- ✅ Admin API working: `/api/admin/stocks/news`
- ✅ Authorization fixed (supports ADMIN and DATA_ENTRY roles)

---

## 🚀 How to Access

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Login as Admin
1. Go to: http://localhost:3000/login
2. Login with admin credentials (role: ADMIN or DATA_ENTRY)

### Step 3: Access News Panel
**Option A:** Via Navigation
- Click "Admin Panel" in header
- Click "Stock News" in sidebar (orange newspaper icon)

**Option B:** Direct URL
- Visit: http://localhost:3000/admin/news

---

## 📰 View News on Stock Pages

News is already displayed on stock detail pages!

### INFY (50 articles)
http://localhost:3000/stocks/INFY

### TCS (50 articles)
http://localhost:3000/stocks/TCS

Scroll down to see the **"Latest News & Updates"** section with:
- 5 news per page
- Pagination
- Article images
- Sources and timestamps
- External links

---

## 🛠️ Admin Panel Features

### 1. View All News
- Paginated table (20 per page)
- Shows: Stock, Headline, Type, Date, Source, Status
- Total: 100 articles

### 2. Search & Filter
- **Search**: By headline, summary, or stock
- **Filter by Symbol**: e.g., INFY, TCS
- **Filter by Type**: news-article, dividend, etc.

### 3. Add News Manually
1. Click "+ Add News Article"
2. Fill form:
   - Stock Symbol: **RELIANCE**
   - Type: **news-article**
   - Headline: **Your headline**
   - Published Date: **Today**
   - (Optional) Summary, Source, URL, Image, Tags
3. Click "Create"

### 4. Edit News
1. Click "Edit" on any article
2. Modify fields
3. Click "Update"

### 5. Delete News
1. Click "Delete" on any article
2. Confirm deletion

---

## 🧪 Test Commands

### Check Statistics
```bash
npm run check-news-stats
```

### Test APIs
```bash
node test-news-api.js
```

### Sync More News
```bash
# Test sync (10 stocks)
npm run sync-activities-test

# Full sync (2142 stocks - takes time)
npm run sync-activities
```

---

## 🔧 Troubleshooting

### Can't see admin panel?
**Check:**
- Are you logged in as ADMIN or DATA_ENTRY?
- Check browser console for errors
- Try refreshing the page

### News not loading in admin panel?
**Check:**
- Is dev server running? (`npm run dev`)
- Check browser console for auth errors
- Try logging out and back in
- Check: `npm run check-news-stats` to verify data exists

### News not showing on stock page?
**Check:**
- Does the stock have news? Run `npm run check-news-stats`
- Only INFY and TCS have news currently
- Scroll down on stock details page

### API errors?
**Check:**
- MongoDB connection in `.env.local`
- Auth token is valid
- Role is ADMIN or DATA_ENTRY (uppercase)

---

## 📊 Current Data Summary

```
Total Stocks: 2,142
Stocks with News: 2 (INFY, TCS)
Total News Articles: 100
Success Rate: 0.09%
```

**To get more news:** Run `npm run sync-activities` to sync all stocks (will take 1-2 hours)

---

## 🎯 Next Steps

1. ✅ **Test the admin panel** - Add a test article
2. ✅ **View news on stock pages** - Visit INFY or TCS
3. ⏳ **Sync more stocks** - Run full sync for more data
4. ⏳ **Setup cron job** - Automate daily sync

---

## 📝 API Examples

### Get news for a stock (Public)
```bash
curl http://localhost:3000/api/stocks/INFY/activities?limit=5
```

### Get all news (Admin)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/stocks/news?limit=20
```

### Add news (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/stocks/news \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stockSymbol": "RELIANCE",
    "activityType": "news-article",
    "headline": "Test headline",
    "publishedAt": "2025-10-10"
  }'
```

---

## ✅ Everything is Working!

- ✅ Database connected
- ✅ 100 news articles stored
- ✅ APIs working
- ✅ Admin panel ready
- ✅ Frontend displaying news
- ✅ Authorization fixed

**Ready to use!** 🎉
