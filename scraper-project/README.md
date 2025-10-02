# Stock Data Scraper Project

A modular Python-based web scraping framework for extracting stock data from various sources and importing it into the Umbrella Stock application.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Scrapers](#scrapers)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🎯 Overview

This scraper project is designed to:
- Fetch stock lists from the Umbrella Stock admin API
- Scrape financial ratios and data from external sources (e.g., Screener.in)
- Post the scraped data back to the Umbrella Stock database via API
- Support both static (requests) and dynamic (Selenium) scraping

---

## ✨ Features

- **Modular Architecture**: Easy to add new scrapers for different data sources
- **Two Scraping Methods**:
  - `site1_scraper.py`: Fast static scraping using requests + BeautifulSoup
  - `site_dynamic.py`: Dynamic scraping with Selenium for JavaScript-heavy sites
- **Authentication**: JWT-based authentication with the Umbrella Stock API
- **Rate Limiting**: Configurable delays to avoid overloading target sites
- **Error Handling**: Graceful error handling with success/failure tracking
- **Pagination Support**: Fetch and process stocks in batches

---

## 📦 Prerequisites

### Required Software

1. **Python 3.8+**
   ```bash
   python --version
   ```

2. **Google Chrome** (for Selenium scrapers)
   - Required for `site_dynamic.py` scraper
   - Download: https://www.google.com/chrome/

3. **ChromeDriver** (automatically managed by webdriver-manager)

### System Requirements

- Windows, macOS, or Linux
- 4GB RAM minimum
- Stable internet connection

---

## 🚀 Installation

### Step 1: Create Virtual Environment

```bash
# Navigate to scraper-project directory
cd scraper-project

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

**Dependencies include:**
- `requests` - HTTP client for API calls
- `beautifulsoup4` - HTML parsing
- `python-dotenv` - Environment variable management
- `selenium` - Browser automation
- `webdriver-manager` - Automatic ChromeDriver management

---

## ⚙️ Configuration

### Step 1: Create `.env` File

Create a `.env` file in the `scraper-project` directory:

```bash
# Copy the example
# Windows:
copy .env.example .env

# macOS/Linux:
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit `.env` with your settings:

```env
# Source API to fetch the stock list
SOURCE_API=http://localhost:3000/api/admin/stocks

# JWT token for authentication (get this from your browser after logging in)
AUTH_TOKEN=your_jwt_token_here

# API endpoint to post scraped stock ratios
POST_API=http://localhost:3000/api/admin/stock-details

# Delay between each stock scrape in seconds (recommended: 1.5-3.0)
DELAY=1.5

# Pagination settings for source API
PAGE=1
LIMIT=300

# Chrome profile path (for Selenium scrapers)
# Windows:
CHROME_PROFILE_PATH=C:/Users/YourUsername/AppData/Local/Google/Chrome/User Data
# macOS:
# CHROME_PROFILE_PATH=/Users/YourUsername/Library/Application Support/Google/Chrome
# Linux:
# CHROME_PROFILE_PATH=/home/yourusername/.config/google-chrome

# Chrome profile name (usually "Default" or "Profile 1")
CHROME_PROFILE_NAME=Default
```

### Step 3: Get Your JWT Token

1. Open your browser and log in to `http://localhost:3000/admin/stocks`
2. Open Browser Developer Tools (F12)
3. Go to **Application** > **Cookies** (Chrome) or **Storage** > **Cookies** (Firefox)
4. Find the JWT token in cookies or local storage
5. Alternatively, check the Network tab for any API request and copy the Authorization header

**Example:**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy only the token part (without "Bearer ") into the `.env` file.

---

## 🎮 Usage

### Basic Usage

Run a scraper using the CLI:

```bash
# Activate virtual environment first
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run a scraper
python run.py <scraper_name>
```

### Available Scrapers

#### 1. **Dummy Scraper** (Static - Fast)
Basic static scraping using requests:

```bash
python run.py dummy
```

**Use when:**
- Target site doesn't require JavaScript
- You need fast scraping
- Simple HTML parsing is sufficient

#### 2. **Stock Ratio Scraper** (Dynamic - Selenium)
Full browser automation for JavaScript-heavy sites:

```bash
python run.py stock_ratio
```

**Use when:**
- Target site uses JavaScript to load content
- You need to interact with the page (click, scroll, etc.)
- Static scraping returns incomplete data

---

## 🔧 Scrapers

### 1. `site1_scraper.py` (Dummy - Static Scraper)

**Features:**
- Fast static HTML scraping
- Uses `requests` + `BeautifulSoup`
- No browser overhead

**Configuration:**
```python
SOURCE_API = "http://localhost:3000/api/admin/stocks"
POST_API_TEMPLATE = "http://localhost:3000/api/admin/stock-details/{symbol}/ratios"
DELAY = 1.5  # seconds between requests
```

**Data Scraped:**
- Financial ratios from Screener.in
- Stock metrics (Market Cap, P/E, ROE, etc.)

**Example Output:**
```
Total stocks fetched: 100
[SUCCESS] RELIANCE saved
[SUCCESS] TCS saved
[ERROR] INVALID: Connection timeout
...
Completed: 95 success, 5 failed
```

---

### 2. `site_dynamic.py` (Stock Ratio - Selenium Scraper)

**Features:**
- Full browser automation
- Handles JavaScript-rendered content
- Uses Chrome with your logged-in session

**Configuration:**
```python
SOURCE_API = "http://localhost:3000/api/admin/stocks"
POST_API_TEMPLATE = "http://localhost:3000/api/admin/stock-details/{symbol}/ratios"
DELAY = 1.5
CHROME_PROFILE_PATH = r"C:\Users\QSS\AppData\Local\Google\Chrome\SeleniumProfile"
```

**Features:**
- Waits for dynamic content to load
- Reuses your Chrome profile (stays logged in)
- Handles pagination automatically

**Example Output:**
```
Total stocks fetched: 300
[SUCCESS] RELIANCE saved
[SUCCESS] TCS saved
[WARN] Timeout waiting for INVALID
[NO DATA] NOTFOUND
...
Completed: 285 success, 15 failed
```

---

### 3. `base.py` (Base Module)

**Reusable Functions:**

```python
# Fetch HTML (static or dynamic)
fetch_html(url, use_selenium=False, wait_time=2)

# Parse HTML with CSS selectors
parse_with_selectors(html, selectors)

# Send data to API
send_to_api(data)
```

**Example Usage:**
```python
from scrapers.base import fetch_html, parse_with_selectors

# Static scraping
html = fetch_html("https://example.com")

# Dynamic scraping
html = fetch_html("https://example.com", use_selenium=True, wait_time=3)

# Parse with selectors
selectors = {
    "group": ".stock-item",
    "symbol": ".symbol",
    "price": ".price"
}
data = parse_with_selectors(html, selectors)
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Authentication Error (401)**

```
[ERROR] 401 Unauthorized
```

**Solution:**
- Your JWT token has expired
- Get a new token from the browser
- Update the `.env` file

---

#### 2. **ChromeDriver Error**

```
selenium.common.exceptions.SessionNotCreatedException
```

**Solution:**
```bash
# Update Chrome to the latest version
# Then reinstall webdriver-manager
pip uninstall webdriver-manager
pip install webdriver-manager
```

---

#### 3. **Rate Limited (429)**

```
[ERROR] 429 Too Many Requests
```

**Solution:**
- Increase `DELAY` in `.env` to 3.0 or higher
- Run the scraper during off-peak hours
- Consider using proxies (advanced)

---

#### 4. **Module Not Found**

```
ModuleNotFoundError: No module named 'requests'
```

**Solution:**
```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Reinstall dependencies
pip install -r requirements.txt
```

---

#### 5. **Chrome Profile Not Found**

```
selenium.common.exceptions.InvalidArgumentException: invalid argument: user data directory is invalid
```

**Solution:**
- Check your `CHROME_PROFILE_PATH` in `.env`
- Make sure the path exists
- Use forward slashes (/) or raw strings (r"path")

**Windows Example:**
```env
CHROME_PROFILE_PATH=C:/Users/YourUsername/AppData/Local/Google/Chrome/User Data
```

---

## 📝 Best Practices

### 1. **Rate Limiting**
- Always use delays between requests (`DELAY=1.5` minimum)
- Respect the target website's `robots.txt`
- Monitor for 429 errors and adjust delays

### 2. **Error Handling**
- Log all errors for debugging
- Implement retry logic for transient errors
- Track success/failure rates

### 3. **Data Validation**
- Validate scraped data before sending to API
- Check for required fields
- Handle missing or malformed data gracefully

### 4. **Token Management**
- Tokens expire after a certain time
- Refresh tokens periodically
- Never commit `.env` to git (already in `.gitignore`)

### 5. **Performance**
- Use static scraping (`dummy`) when possible (faster)
- Only use Selenium (`stock_ratio`) when necessary
- Process stocks in batches (pagination)

---

## 📂 Project Structure

```
scraper-project/
├── .env                    # Environment variables (not in git)
├── .gitignore             # Git ignore rules
├── requirements.txt       # Python dependencies
├── run.py                 # CLI runner
├── README.md             # This file
└── scrapers/
    ├── base.py           # Base scraping utilities
    ├── site1_scraper.py  # Static scraper (dummy)
    ├── site2_scraper.py  # Template scraper
    └── site_dynamic.py   # Selenium scraper (stock_ratio)
```

---

## 🔐 Security Notes

- **Never commit `.env`** - Contains sensitive tokens
- **JWT tokens expire** - Refresh them regularly
- **Rate limiting** - Respect target site's terms of service
- **Use responsibly** - Don't overload target servers

---

## 🚦 Workflow Example

### Complete Workflow

```bash
# 1. Activate virtual environment
venv\Scripts\activate

# 2. Update .env with fresh JWT token
# Edit .env file

# 3. Test with small batch (10 stocks)
# Set LIMIT=10 in .env
python run.py stock_ratio

# 4. Check results in admin panel
# Open http://localhost:3000/admin/stocks

# 5. Run full batch
# Set LIMIT=300 in .env
python run.py stock_ratio

# 6. Monitor progress
# Watch console output for errors

# 7. Verify data
# Check database or admin panel
```

---

## 📊 Expected Results

### Successful Run

```
Total stocks fetched: 300
[SUCCESS] RELIANCE saved
[SUCCESS] TCS saved
[SUCCESS] INFY saved
...
Completed: 295 success, 5 failed
```

### With Errors

```
Total stocks fetched: 300
[SUCCESS] RELIANCE saved
[ERROR] INVALID: 404 Not Found
[WARN] Timeout waiting for NOTLISTED
[SUCCESS] TCS saved
...
Completed: 280 success, 20 failed
```

---

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Verify your `.env` configuration
3. Check the console logs for error details
4. Ensure your JWT token is valid and not expired

---

## 📄 License

This scraper project is part of the Umbrella Stock application.

---

## 🙏 Credits

Built with:
- [Requests](https://docs.python-requests.org/) - HTTP library
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) - HTML parser
- [Selenium](https://www.selenium.dev/) - Browser automation
- [python-dotenv](https://github.com/theskumar/python-dotenv) - Environment management

---

**Happy Scraping! 🚀**
