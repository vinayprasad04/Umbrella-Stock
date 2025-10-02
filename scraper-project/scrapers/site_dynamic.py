import os
import time
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

load_dotenv()

# ===== CONFIGURATION =====
SOURCE_API = os.getenv("SOURCE_API")  # e.g., http://localhost:3000/api/admin/stocks
POST_API = os.getenv("POST_API")      # e.g., http://localhost:3000/api/admin/stock-details
AUTH_TOKEN = os.getenv("AUTH_TOKEN")
DELAY = float(os.getenv("DELAY", 1.5))

PAGE_NUMBER = os.getenv("PAGE") 
TOTAL_NUMBER = os.getenv("LIMIT")

POST_API_TEMPLATE = f"{POST_API}/{{symbol}}/ratios"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

# Chrome user profile (dedicated SeleniumProfile)
CHROME_PROFILE_PATH = r"C:\Users\QSS\AppData\Local\Google\Chrome\SeleniumProfile"

# ===== SELENIUM SETUP =====
def get_driver():
    chrome_options = Options()
    chrome_options.add_argument(f"user-data-dir={CHROME_PROFILE_PATH}")
    chrome_options.add_argument("--start-maximized")
    service = Service()
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

# ===== FUNCTIONS =====
def get_stock_list(page=1, limit=100, sortBy="symbol", sortOrder="asc"):
    """Fetch stock symbols from your source API"""
    params = {"page": page, "limit": limit, "sortBy": sortBy, "sortOrder": sortOrder, "hasRatios":"false"}
    r = requests.get(SOURCE_API, headers=HEADERS, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    return data.get("data", {}).get("stocks", [])

def scrape_ratios(driver, symbol):
    """Scrape ratios from Screener site using Selenium"""
    url = f"https://www.screener.in/company/{symbol}/"
    driver.get(url)

    # wait until ratios load
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "#top-ratios li"))
        )
    except Exception:
        print(f"[WARN] Timeout waiting for {symbol}")
        return {}

    time.sleep(1)  # let JS finish
    soup = BeautifulSoup(driver.page_source, "html.parser")

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
    """Send scraped data to POST API"""
    url = POST_API_TEMPLATE.format(symbol=symbol)
    payload = {"ratios": ratios}
    r = requests.post(url, headers=HEADERS, json=payload, timeout=15)
    r.raise_for_status()
    return r.status_code == 200

# ===== MAIN =====
def main():
    driver = get_driver()
    page = PAGE_NUMBER
    limit = TOTAL_NUMBER
    success_count = 0
    failed_count = 0

    stocks = get_stock_list(page=page, limit=limit)
    print(f"Total stocks fetched: {len(stocks)}")

    for stock in stocks:
        symbol = stock.get("symbol")
        try:
            ratios = scrape_ratios(driver, symbol)
            if ratios:
                if send_ratios(symbol, ratios):
                    print(f"[SUCCESS] {symbol} saved")
                    success_count += 1
                else:
                    print(f"[FAILED] {symbol} not saved")
                    failed_count += 1
            else:
                print(f"[NO DATA] {symbol}")
                failed_count += 1
        except Exception as e:
            print(f"[ERROR] {symbol}: {e}")
            failed_count += 1

        time.sleep(DELAY)

    driver.quit()
    print(f"\nCompleted: {success_count} success, {failed_count} failed")

# ===== ENTRY POINT =====
if __name__ == "__main__":
    main()
