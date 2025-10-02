import os
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv()

AUTH_TOKEN = os.getenv("AUTH_TOKEN")
DEST_API = os.getenv("DEST_API")

HEADERS_SRC = {"User-Agent": "Mozilla/5.0"}
HEADERS_DEST = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}


def fetch_html(url: str, use_selenium=False, wait_time=2) -> str:
    """Fetch HTML page, optionally via Selenium for JS-rendered content."""
    if use_selenium:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        driver.get(url)
        time.sleep(wait_time)  # wait for content to load
        html = driver.page_source
        driver.quit()
        return html
    else:
        r = requests.get(url, headers=HEADERS_SRC, timeout=15)
        r.raise_for_status()
        return r.text


def parse_with_selectors(html: str, selectors: dict):
    """Generic parse: selectors is dict {field: css_selector}"""
    soup = BeautifulSoup(html, "html.parser")
    records = []

    for grp in soup.select(selectors["group"]):
        record = {}
        for key, sel in selectors.items():
            if key == "group":
                continue
            el = grp.select_one(sel)
            record[key] = el.get_text(strip=True) if el else None
        records.append(record)
    return records


def send_to_api(data: list):
    for rec in data:
        resp = requests.post(DEST_API, headers=HEADERS_DEST, json=rec, timeout=15)
        if resp.status_code != 200:
            print("Error", resp.status_code, resp.text)
        else:
            print("Saved", rec)
