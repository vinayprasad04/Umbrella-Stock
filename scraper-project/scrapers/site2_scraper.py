from scrapers.base import fetch_html, parse_with_selectors, send_to_api

SOURCE_URL = "https://another.com/data"

SELECTORS = {
    "group": ".row",
    "name": ".name",
    "price": ".price"
}

def main():
    html = fetch_html(SOURCE_URL)
    items = parse_with_selectors(html, SELECTORS)
    send_to_api(items)

if __name__ == "__main__":
    main()
