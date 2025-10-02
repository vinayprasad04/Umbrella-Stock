import os
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

SOURCE_API = os.getenv("SOURCE_API")  # e.g., http://localhost:3000/api/admin/stocks
AUTH_TOKEN = os.getenv("AUTH_TOKEN")  # your JWT token
POST_API = os.getenv("POST_API")      # e.g., http://localhost:3000/api/admin/stock-details
DELAY = float(os.getenv("DELAY", 1.5))

HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Accept": "*/*",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    "Referer": "http://localhost:3000/admin/stocks",
    "Origin": "http://localhost:3000",
}

COOKIES = {
    "next-auth.csrf-token": os.getenv("CSRF_TOKEN", ""),
    "next-auth.callback-url": "http%3A%2F%2Flocalhost%3A3000"
}

def get_stock_list(page=1, limit=100):
    """Fetch stock list from API"""
    params = {
        "page": page,
        "limit": limit,
        "sortBy": "symbol",
        "sortOrder": "asc"
    }
    r = requests.get(SOURCE_API, headers=HEADERS, cookies=COOKIES, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    return data.get("data", {}).get("stocks", [])

def fetch_html(url):
    """Fetch HTML of a stock page"""
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    return r.text

def scrape_stock(stock):
    url = f"https://www.screener.in/company/{stock['symbol']}/"
    html = fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")

    ratios = {}
    ratio_list = soup.select("#top-ratios li.flex.flex-space-between")
    for li in soup.select("#top-ratios li.flex.flex-space-between"):
        # Key
        key_tag = li.select_one("span.name")
        if not key_tag:
            continue
        key = key_tag.get_text(strip=True)

        # All numbers in this li
        number_tags = li.select("span.value .number")
        if not number_tags:
            continue

        # Combine multiple numbers with " / "
        if len(number_tags) > 1:
            values = [nt.get_text(strip=True).replace(",", "") for nt in number_tags]
            ratios[key] = " / ".join(values)
        else:
            value_tag = number_tags[0]
            parent_text = li.select_one("span.value").get_text(strip=True)
            value_text = value_tag.get_text(strip=True).replace(",", "").replace("₹", "")
            if "%" in parent_text:
                ratios[key] = float(value_text)  # Keep % as float
            else:
                try:
                    ratios[key] = float(value_text)
                except:
                    ratios[key] = value_text
    return ratios

def post_stock_ratios(symbol, ratios):
    """Send scraped ratios to API"""
    url = f"{POST_API}/{symbol}/ratios"
    payload = {"ratios": ratios}
    r = requests.post(url, json=payload, headers=HEADERS, cookies=COOKIES)
    return r.status_code, r.text

def main():
    page = 1
    limit = 100
    stocks = get_stock_list(page=page, limit=limit)

    success_count = 0
    fail_count = 0

    for stock in stocks:
        symbol = stock["symbol"]
        try:
            ratios = scrape_stock(stock)
            code, resp = post_stock_ratios(symbol, ratios)
            if code == 200:
                print(f"[SUCCESS] {symbol} saved")
                success_count += 1
            else:
                print(f"[FAIL] {symbol} status={code} resp={resp}")
                fail_count += 1
        except Exception as e:
            print(f"[ERROR] {symbol} exception={e}")
            fail_count += 1
        time.sleep(DELAY)

    print(f"\nCompleted. Success: {success_count}, Fail: {fail_count}")

if __name__ == "__main__":
    main()
