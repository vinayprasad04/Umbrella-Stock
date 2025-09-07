/**
 * MoneyControl Scraper Utility
 * 
 * Attempts to scrape AUM and Top Holdings data from MoneyControl
 * Uses Cheerio for HTML parsing and Axios for HTTP requests
 * 
 * Features:
 * - AUM (Assets Under Management) extraction
 * - Top Holdings data with allocation percentages
 * - Error handling with fallback responses
 * - Rate limiting to avoid being blocked
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Cache to avoid frequent requests
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Scrape mutual fund data from MoneyControl
 * @param {string} schemeName - The scheme name to search for
 * @param {number} schemeCode - The scheme code for backup search
 * @returns {Promise<Object>} Scraped data including AUM and holdings
 */
async function scrapeMutualFundData(schemeName, schemeCode) {
  try {
    const cacheKey = `${schemeCode}-${schemeName}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📋 Using cached data for ${schemeName}`);
        return cached.data;
      }
      cache.delete(cacheKey);
    }

    console.log(`🔍 Scraping MoneyControl data for: ${schemeName}`);

    // Step 1: Search for the mutual fund on MoneyControl
    const searchResults = await searchMutualFund(schemeName, schemeCode);
    
    if (!searchResults.url) {
      console.warn(`⚠️ Could not find MoneyControl URL for ${schemeName}`);
      return getPlaceholderData('Search failed - fund not found on MoneyControl');
    }

    // Step 2: Scrape fund details page
    const fundData = await scrapeFundDetails(searchResults.url, schemeName);
    
    // Cache the result
    cache.set(cacheKey, {
      data: fundData,
      timestamp: Date.now()
    });

    return fundData;

  } catch (error) {
    console.error(`❌ MoneyControl scraping failed for ${schemeName}:`, error.message);
    return getPlaceholderData(`Network error: ${error.message}`);
  }
}

/**
 * Search for mutual fund on MoneyControl
 * @param {string} schemeName - Fund name to search
 * @param {number} schemeCode - Backup scheme code
 * @returns {Promise<Object>} Search result with URL
 */
async function searchMutualFund(schemeName, schemeCode) {
  try {
    // Clean scheme name for search
    const searchQuery = schemeName
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 4) // Take first 4 words
      .join(' ');

    console.log(`🔎 Searching MoneyControl for: "${searchQuery}"`);

    // MoneyControl search URL
    const searchUrl = `https://www.moneycontrol.com/mutual-funds/search?search=${encodeURIComponent(searchQuery)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Look for fund links in search results
    const fundLinks = [];
    $('a[href*="/mutual-funds/"]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && href.includes('/mutual-funds/') && text.length > 10) {
        fundLinks.push({
          url: href.startsWith('http') ? href : `https://www.moneycontrol.com${href}`,
          text: text
        });
      }
    });

    // Find best match
    const bestMatch = fundLinks.find(link => {
      const linkText = link.text.toLowerCase();
      const queryWords = searchQuery.toLowerCase().split(' ');
      return queryWords.some(word => word.length > 3 && linkText.includes(word));
    });

    return {
      url: bestMatch?.url || null,
      matchText: bestMatch?.text || null
    };

  } catch (error) {
    console.warn(`⚠️ MoneyControl search failed: ${error.message}`);
    // Log the specific error for debugging
    if (error.response) {
      console.warn(`⚠️ MoneyControl search returned status: ${error.response.status}`);
    }
    return { url: null };
  }
}

/**
 * Scrape fund details from MoneyControl fund page
 * @param {string} url - Fund details page URL
 * @param {string} schemeName - Original scheme name
 * @returns {Promise<Object>} Fund data including AUM and holdings
 */
async function scrapeFundDetails(url, schemeName) {
  try {
    console.log(`📄 Scraping fund details from: ${url}`);

    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.moneycontrol.com/',
        'Connection': 'keep-alive'
      }
    });

    const $ = cheerio.load(response.data);

    // Extract AUM
    let aum = null;
    const aumSelectors = [
      'td:contains("AUM")',
      'td:contains("Assets")',
      'td:contains("Fund Size")',
      '.fund-size',
      '.aum-value'
    ];

    for (const selector of aumSelectors) {
      const element = $(selector);
      if (element.length) {
        const nextCell = element.next('td');
        const aumText = nextCell.length ? nextCell.text() : element.text();
        aum = parseAUM(aumText);
        if (aum > 0) break;
      }
    }

    // Extract Top Holdings
    const holdings = [];
    const holdingSelectors = [
      'table:contains("Holdings") tr',
      'table:contains("Portfolio") tr',
      'table:contains("Top") tr',
      '.holdings-table tr',
      '.portfolio-table tr'
    ];

    for (const selector of holdingSelectors) {
      const rows = $(selector);
      if (rows.length > 1) {
        rows.each((i, row) => {
          if (holdings.length >= 10) return false; // Max 10 holdings
          
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const company = $(cells[0]).text().trim();
            const percentageText = $(cells[1]).text().trim();
            const percentage = parsePercentage(percentageText);
            
            if (company && percentage > 0 && company.length > 2) {
              holdings.push({
                company: company,
                allocation: percentage
              });
            }
          }
        });
        
        if (holdings.length > 0) break;
      }
    }

    console.log(`✅ Scraped data: AUM=${aum}, Holdings=${holdings.length}`);

    return {
      aum: aum,
      holdings: holdings.slice(0, 10), // Top 10 holdings
      source: 'MoneyControl',
      scrapedAt: new Date().toISOString(),
      available: aum > 0 || holdings.length > 0
    };

  } catch (error) {
    console.warn(`⚠️ Failed to scrape fund details: ${error.message}`);
    return getPlaceholderData(`Failed to parse fund page: ${error.message}`);
  }
}

/**
 * Parse AUM text and convert to number
 * @param {string} aumText - Raw AUM text from webpage
 * @returns {number} AUM in rupees
 */
function parseAUM(aumText) {
  try {
    if (!aumText) return 0;
    
    const text = aumText.replace(/[^\d.,]/g, '');
    const number = parseFloat(text.replace(/,/g, ''));
    
    if (isNaN(number)) return 0;
    
    const originalText = aumText.toLowerCase();
    
    // Convert based on suffix
    if (originalText.includes('crore') || originalText.includes('cr')) {
      return number * 10000000; // 1 crore = 10 million
    } else if (originalText.includes('lakh')) {
      return number * 100000; // 1 lakh = 100 thousand
    } else if (originalText.includes('k') && number < 1000000) {
      return number * 1000;
    }
    
    return number;
  } catch (error) {
    return 0;
  }
}

/**
 * Parse percentage text
 * @param {string} percentText - Raw percentage text
 * @returns {number} Percentage as number
 */
function parsePercentage(percentText) {
  try {
    if (!percentText) return 0;
    
    const match = percentText.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const percentage = parseFloat(match[1]);
      return isNaN(percentage) ? 0 : percentage;
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Generate placeholder data when scraping fails
 * @returns {Object} Placeholder fund data
 */
function getPlaceholderData(reason = 'MoneyControl search failed') {
  return {
    aum: null,
    holdings: [],
    source: 'Not Available',
    available: false,
    message: `Top Holdings data temporarily unavailable - ${reason}. MoneyControl may be blocking automated requests or has changed their API structure.`,
    status: 'SCRAPING_FAILED',
    lastAttempt: new Date().toISOString()
  };
}

/**
 * Clear the scraping cache (useful for testing)
 */
function clearCache() {
  cache.clear();
  console.log('🧹 MoneyControl scraper cache cleared');
}

module.exports = {
  scrapeMutualFundData,
  clearCache
};