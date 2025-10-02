import sys

SCRAPERS = {
    "dummy": "scrapers.site1_scraper",
    "stock_ratio": "scrapers.site_dynamic"
}

if len(sys.argv) < 2:
    print("Usage: python run.py site1")
    sys.exit(1)

site = sys.argv[1]
if site not in SCRAPERS:
    print(f"Unknown site: {site}")
    sys.exit(1)

module = __import__(SCRAPERS[site], fromlist=["main"])
module.main()
