import sys

SCRAPERS = {
    "site1": "scrapers.site1_scraper",
    "site2": "scrapers.site2_scraper",
    "dynamic": "scrapers.site_dynamic"
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
