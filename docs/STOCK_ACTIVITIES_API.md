# Stock Activities API Documentation

## Overview

The Stock Activities system provides a unified way to store and retrieve various types of stock-related activities including news articles, videos, dividends, announcements, and legal orders.

## Database Schema

### Collection: `stockactivities`

A single unified collection that stores all activity types for all stocks.

**Common Fields (All Activity Types):**
- `stockSymbol` (String, required) - Stock symbol (e.g., "INFY", "RELIANCE")
- `activityType` (String, required) - Type of activity
  - `news-article`
  - `news-video`
  - `dividend`
  - `announcement`
  - `legal-order`
- `headline` (String, required) - Title/Headline of the activity
- `summary` (String) - Brief description
- `publishedAt` (Date, required) - Publication date
- `source` (String) - Source/Publisher name
- `sourceUrl` (String) - Original URL
- `imageUrl` (String) - Thumbnail image URL
- `tags` (Array of Strings) - Tags/categories
- `isActive` (Boolean) - Is the activity active/visible
- `sentiment` (String) - "positive", "negative", "neutral"
- `priority` (Number) - Priority for sorting
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

**News-Specific Fields:**
- `feedType` (String) - "news-article" or "news-video"
- `version` (String) - API version

**Dividend-Specific Fields:**
- `dividendAmount` (Number) - Dividend amount per share
- `dividendType` (String) - "interim", "final", "special"
- `exDate` (Date) - Ex-dividend date
- `recordDate` (Date) - Record date
- `paymentDate` (Date) - Payment date

**Announcement-Specific Fields:**
- `announcementCategory` (String) - "corporate-action", "financial-results", "board-meeting", "other"
- `attachments` (Array) - File attachments
  - `fileName` (String)
  - `fileUrl` (String)
  - `fileType` (String)

**Legal Order-Specific Fields:**
- `orderType` (String) - "sebi-order", "court-order", "regulatory"
- `jurisdiction` (String) - "SEBI", "High Court", etc.
- `caseNumber` (String) - Case/Order reference number

## API Endpoints

### 1. Get Activities for a Stock

**Endpoint:** `GET /api/stocks/[symbol]/activities`

**Description:** Fetch all activities for a specific stock with pagination and filtering.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `type` (optional) - Filter by activity type
  - Values: `news-article`, `news-video`, `dividend`, `announcement`, `legal-order`
- `startDate` (optional) - Filter activities from this date (ISO format)
- `endDate` (optional) - Filter activities until this date (ISO format)

**Example Request:**
```bash
GET /api/stocks/INFY/activities?page=1&limit=20&type=news-article
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "...",
        "stockSymbol": "INFY",
        "activityType": "news-article",
        "headline": "Infosys announces Q4 results",
        "summary": "Strong quarter with 15% growth...",
        "publishedAt": "2025-10-09T10:30:00.000Z",
        "source": "Economic Times",
        "sourceUrl": "https://...",
        "imageUrl": "https://...",
        "tags": ["earnings", "q4-results"],
        "feedType": "news-article",
        "isActive": true,
        "createdAt": "2025-10-10T00:00:00.000Z",
        "updatedAt": "2025-10-10T00:00:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

### 2. Get Latest Activities (All Stocks)

**Endpoint:** `GET /api/stocks/activities/latest`

**Description:** Get latest activities across all stocks (news feed).

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `type` (optional) - Filter by activity type
- `symbols` (optional) - Comma-separated list of symbols to filter

**Example Request:**
```bash
GET /api/stocks/activities/latest?page=1&limit=20&type=news-article&symbols=INFY,TCS,RELIANCE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [...],
    "total": 500,
    "page": 1,
    "limit": 20
  }
}
```

---

### 3. Sync Activities from Tickertape (Admin Only)

**Endpoint:** `POST /api/admin/stocks/activities/sync`

**Description:** Sync activities from Tickertape API. Requires admin authentication.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "symbols": ["INFY", "TCS", "RELIANCE"],
  "types": ["news-article", "news-video"],
  "count": 50,
  "syncAll": false
}
```

**Parameters:**
- `symbols` (Array, optional) - List of stock symbols to sync
- `types` (Array, optional, default: ["news-article", "news-video"]) - Activity types to fetch
- `count` (Number, optional, default: 50) - Number of activities to fetch per stock
- `syncAll` (Boolean, optional, default: false) - Sync all active stocks

**Example Request:**
```bash
POST /api/admin/stocks/activities/sync
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "symbols": ["INFY", "TCS"],
  "count": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "stockSymbol": "INFY",
        "status": "success",
        "added": 25,
        "skipped": 25
      },
      {
        "stockSymbol": "TCS",
        "status": "success",
        "added": 30,
        "skipped": 20
      }
    ],
    "totalAdded": 55,
    "totalSkipped": 45,
    "totalErrors": 0
  },
  "message": "Synced 2 stocks: 55 added, 45 skipped, 0 errors"
}
```

---

## Cron Job / Scheduled Sync

### Manual Sync Command

```bash
npm run sync-activities
```

### Automated Daily Sync

**Option 1: Linux/Mac Cron**
```bash
# Run daily at 2 AM
crontab -e

# Add this line:
0 2 * * * cd /path/to/Umberlla-Stock && npm run sync-activities >> logs/sync-activities.log 2>&1
```

**Option 2: Windows Task Scheduler**
1. Open Task Scheduler
2. Create Basic Task
3. Schedule: Daily at 2:00 AM
4. Action: Start a Program
5. Program: `cmd.exe`
6. Arguments: `/c cd D:\work\Test\Next\Umberlla-Stock && npm run sync-activities`

**Option 3: Vercel Cron (Recommended for Production)**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/stocks/activities/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Option 4: GitHub Actions**

Create `.github/workflows/sync-activities.yml`:
```yaml
name: Sync Stock Activities

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run sync-activities
        env:
          MONGODB_CONNECTION_URI: ${{ secrets.MONGODB_CONNECTION_URI }}
```

---

## Usage Examples

### Frontend: Display News on Stock Details Page

```typescript
// components/StockActivities.tsx
import { useEffect, useState } from 'react';

interface Activity {
  _id: string;
  headline: string;
  summary: string;
  publishedAt: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  activityType: string;
}

export default function StockActivities({ symbol }: { symbol: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    async function fetchActivities() {
      try {
        const typeParam = activeTab !== 'all' ? `&type=${activeTab}` : '';
        const res = await fetch(`/api/stocks/${symbol}/activities?limit=20${typeParam}`);
        const data = await res.json();
        if (data.success) {
          setActivities(data.data.activities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [symbol, activeTab]);

  return (
    <div className="stock-activities">
      <div className="tabs">
        <button onClick={() => setActiveTab('all')}>All</button>
        <button onClick={() => setActiveTab('news-article')}>News</button>
        <button onClick={() => setActiveTab('dividend')}>Dividends</button>
        <button onClick={() => setActiveTab('announcement')}>Announcements</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="activities-list">
          {activities.map(activity => (
            <div key={activity._id} className="activity-card">
              {activity.imageUrl && <img src={activity.imageUrl} alt="" />}
              <h3>{activity.headline}</h3>
              <p>{activity.summary}</p>
              <div className="meta">
                <span>{new Date(activity.publishedAt).toLocaleDateString()}</span>
                <span>{activity.source}</span>
              </div>
              <a href={activity.sourceUrl} target="_blank">Read More →</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Database Indexes

The following indexes are automatically created for optimal query performance:

1. `{ stockSymbol: 1, publishedAt: -1 }` - For stock-specific queries sorted by date
2. `{ stockSymbol: 1, activityType: 1, publishedAt: -1 }` - For filtered queries
3. `{ activityType: 1, publishedAt: -1 }` - For activity type queries
4. `{ isActive: 1, publishedAt: -1 }` - For active activities
5. `{ stockSymbol: 1, activityType: 1, headline: 1, publishedAt: 1 }` - Unique constraint to prevent duplicates
6. Text index on `headline` and `summary` - For search functionality

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (missing token)
- `403` - Forbidden (admin access required)
- `405` - Method not allowed
- `500` - Internal server error

---

## Future Enhancements

Potential features to add:

1. **Sentiment Analysis** - Auto-detect sentiment from news headlines
2. **Search API** - Full-text search across activities
3. **Webhooks** - Real-time notifications for new activities
4. **Analytics** - Activity trends and statistics
5. **User Bookmarks** - Allow users to save important activities
6. **Email Notifications** - Alert users about important activities for watchlist stocks
