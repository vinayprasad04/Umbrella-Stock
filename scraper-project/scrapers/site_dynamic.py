from scrapers.base import fetch_html, parse_with_selectors, send_to_api

SOURCE_URL = "https://example.com/dynamic_page"

SELECTORS = {
    "group": ".item",
    "id": ".id",
    "title": ".title",
    "value": ".value"
}

def main():
    html = fetch_html(SOURCE_URL, use_selenium=True, wait_time=3)
    items = parse_with_selectors(html, SELECTORS)
    send_to_api(items)
