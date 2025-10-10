# Admin News Management Panel

## Overview
Complete admin panel to manually add, edit, delete, and view stock news articles.

## Access

**URL**: http://localhost:3000/admin/news

**Requirements**: Admin login required

## Features

### ✅ View All News
- Paginated list of all news articles (20 per page)
- Shows: Stock Symbol, Headline, Type, Published Date, Source, Status
- Real-time statistics dashboard

### ✅ Search & Filter
- **Search**: Search by headline, summary, or stock symbol
- **Stock Filter**: Filter by specific stock symbol
- **Type Filter**: Filter by activity type (news-article, dividend, etc.)

### ✅ Add News
- Click "Add News Article" button
- Fill in the form:
  - **Stock Symbol** * (required) - e.g., INFY, TCS
  - **Type** * (required) - news-article, news-video, dividend, announcement, legal-order
  - **Headline** * (required)
  - **Summary** (optional)
  - **Published Date** * (required)
  - **Source** (optional) - e.g., "Economic Times"
  - **Source URL** (optional) - Link to original article
  - **Image URL** (optional) - Article thumbnail
  - **Tags** (optional) - Comma-separated (e.g., "earnings, growth")
  - **Active** (checkbox) - Show/hide from users

### ✅ Edit News
- Click "Edit" button on any article
- Modify any field
- Click "Update" to save

### ✅ Delete News
- Click "Delete" button on any article
- Confirm deletion
- Article is permanently removed

## API Endpoints

### 1. Get All News (Admin)
```
GET /api/admin/stocks/news
Headers: Authorization: Bearer <admin-token>

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- symbol: Filter by stock symbol
- type: Filter by activity type
- search: Search term

Response:
{
  "success": true,
  "data": {
    "activities": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 2. Create News
```
POST /api/admin/stocks/news
Headers: Authorization: Bearer <admin-token>
Content-Type: application/json

Body:
{
  "stockSymbol": "INFY",
  "activityType": "news-article",
  "headline": "Infosys announces Q4 results",
  "summary": "Strong quarter with 15% growth",
  "publishedAt": "2025-10-10",
  "source": "Economic Times",
  "sourceUrl": "https://...",
  "imageUrl": "https://...",
  "tags": ["earnings", "growth"]
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "News article created successfully"
}
```

### 3. Get Single News
```
GET /api/admin/stocks/news/:id
Headers: Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": { ... }
}
```

### 4. Update News
```
PUT /api/admin/stocks/news/:id
Headers: Authorization: Bearer <admin-token>
Content-Type: application/json

Body: (any fields to update)
{
  "headline": "Updated headline",
  "summary": "Updated summary",
  "isActive": false
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "News article updated successfully"
}
```

### 5. Delete News
```
DELETE /api/admin/stocks/news/:id
Headers: Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "News article deleted successfully"
}
```

## Activity Types

1. **news-article** - Regular news article
2. **news-video** - Video news
3. **dividend** - Dividend announcements
4. **announcement** - Corporate announcements
5. **legal-order** - Legal or regulatory orders

## Usage Examples

### Example 1: Add News Article
```javascript
POST /api/admin/stocks/news

{
  "stockSymbol": "RELIANCE",
  "activityType": "news-article",
  "headline": "Reliance Industries announces mega expansion",
  "summary": "Company to invest ₹10,000 crore in new projects",
  "publishedAt": "2025-10-10",
  "source": "Business Standard",
  "sourceUrl": "https://example.com/article",
  "tags": ["expansion", "investment"]
}
```

### Example 2: Add Dividend Announcement
```javascript
POST /api/admin/stocks/news

{
  "stockSymbol": "TCS",
  "activityType": "dividend",
  "headline": "TCS declares interim dividend of ₹18 per share",
  "summary": "Ex-date: October 20, 2025",
  "publishedAt": "2025-10-10",
  "source": "Company Announcement"
}
```

### Example 3: Search News
```
GET /api/admin/stocks/news?search=dividend&page=1&limit=20
```

### Example 4: Filter by Stock
```
GET /api/admin/stocks/news?symbol=INFY&page=1&limit=20
```

## Dashboard Statistics

The admin panel shows:
- **Total Articles**: Total news articles in database
- **Current Page**: Current page / Total pages
- **Showing**: Number of articles on current page
- **Per Page**: Articles per page (20)

## Validation Rules

### Required Fields:
- `stockSymbol`: Must be a valid stock symbol
- `activityType`: Must be one of the valid types
- `headline`: Cannot be empty
- `publishedAt`: Must be a valid date

### Unique Constraint:
Combination of (stockSymbol + activityType + headline + publishedAt) must be unique to prevent duplicates.

## Security

- All endpoints require admin authentication
- JWT token must be provided in Authorization header
- Only users with `role: 'admin'` can access
- Non-admin users will be redirected to login

## Tips

1. **Bulk Import**: Use the sync scripts to import from Tickertape API
2. **Manual Entry**: Use admin panel for custom news/announcements
3. **Edit Imported**: Fix/enhance auto-imported news
4. **Mark Inactive**: Hide news without deleting (set isActive: false)
5. **Add Images**: Enhance imported news with image URLs

## Screenshots

### Admin Panel View
```
+----------------------------------------------------------+
| Stock News Management                      [+ Add News]  |
+----------------------------------------------------------+
| Stats: Total: 100 | Page: 1/5 | Showing: 20 | Per Page: 20
+----------------------------------------------------------+
| Filters:                                                  |
| [Search...] [Symbol: INFY] [Type: All] [Search Button]  |
+----------------------------------------------------------+
| Stock | Headline           | Type    | Date     | Actions|
+----------------------------------------------------------+
| INFY  | Q4 Results...     | news    | Oct 10   | Edit|Del
| TCS   | Dividend Declared | divid   | Oct 9    | Edit|Del
+----------------------------------------------------------+
| Pagination: [Previous] Page 1 of 5 [Next]               |
+----------------------------------------------------------+
```

## Integration with Frontend

News added via admin panel will automatically appear on:
- Stock details pages: `/stocks/{symbol}`
- StockNews component will fetch and display them
- Pagination works automatically

## Troubleshooting

**Issue**: Can't access admin panel
- **Solution**: Make sure you're logged in as admin (role: 'admin')

**Issue**: News not showing on stock page
- **Solution**: Check `isActive` is set to `true`

**Issue**: Duplicate error when adding news
- **Solution**: Change headline or date slightly to make it unique

**Issue**: Changes not reflecting
- **Solution**: Refresh the page or clear browser cache

## Testing

Test the admin panel:
1. Login as admin
2. Visit: http://localhost:3000/admin/news
3. Try adding a test article
4. Edit it
5. View it on the stock details page
6. Delete it

---

**Created**: October 10, 2025
**Version**: 1.0
**Author**: Claude Code
