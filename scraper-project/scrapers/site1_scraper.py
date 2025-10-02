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

# ===== CONFIGURATION =====
POST_API_TEMPLATE = "http://localhost:3000/api/admin/stock-details/{symbol}/ratios"


# Screener login cookies
COOKIES = {
    "sessionid": "jcnlwstd2m83epb6bungcsdv1vws70f3",
    "csrftoken": "P26rOqposaoKXjQHxp4dt1KwjevtJeTJ",
    "ext_name": "ojplmecpdpgccookcobabopnaifgidhf"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

# ===== FUNCTIONS =====
def get_stock_list(page=1, limit=100, sortBy="symbol", sortOrder="asc"):
    params = {"page": page, "limit": limit, "sortBy": sortBy, "sortOrder": sortOrder}
    r = requests.get(SOURCE_API, headers=HEADERS, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    return data.get("data", {}).get("stocks", [])

def scrape_ratios(symbol):
    url = f"https://www.screener.in/company/{symbol}/"
    r = requests.get(url, headers={"User-Agent": HEADERS["User-Agent"]}, cookies=COOKIES)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    ratios = {}
    for li in soup.select("#top-ratios li.flex.flex-space-between"):
        key = li.select_one("span.name").get_text(strip=True)
        numbers = [n.get_text(strip=True) for n in li.select("span.number")]
        if " / " in li.get_text():
            value = " / ".join(numbers)
        elif len(numbers) == 1:
            value = numbers[0]
        else:
            value = numbers
        ratios[key] = value
    return ratios

def send_ratios(symbol, ratios):
    url = POST_API_TEMPLATE.format(symbol=symbol)
    payload = {"ratios": ratios}
    r = requests.post(url, headers=HEADERS, json=payload, timeout=15)
    r.raise_for_status()
    return r.status_code == 200

# ===== MAIN =====
def main():
    page = 1
    limit = 100
    success_count = 0
    failed_count = 0

    stocks = get_stock_list(page=page, limit=limit)
    print(f"Total stocks fetched: {len(stocks)}")

    for stock in stocks:
        symbol = stock.get("symbol")
        try:
            ratios = scrape_ratios(symbol)
            if send_ratios(symbol, ratios):
                print(f"[SUCCESS] {symbol} saved")
                success_count += 1
            else:
                print(f"[FAILED] {symbol} not saved")
                failed_count += 1
        except Exception as e:
            print(f"[ERROR] {symbol}: {e}")
            failed_count += 1

        time.sleep(1)  # delay between requests

    print(f"\nCompleted: {success_count} success, {failed_count} failed")

# ===== ENTRY POINT =====
if __name__ == "__main__":
    main()
