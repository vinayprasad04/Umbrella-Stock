/**
 * Multi-Source Mutual Fund Data Scraper
 * 
 * Attempts to scrape AUM and Top Holdings data from multiple sources:
 * - MoneyControl
 * - Zerodha Coin
 * - TickerTape
 * - ValueResearch Online
 * - BSE India
 * - NSE India
 * 
 * Features:
 * - Multi-source fallback system
 * - Intelligent fund name matching
 * - Comprehensive error handling
 * - Source priority management
 * - Data validation and normalization
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Cache to avoid frequent requests
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Source configuration with priorities (lower number = higher priority)
const DATA_SOURCES = [
  {
    name: 'TickerTape',
    priority: 1,
    scraper: scrapeTickerTape,
    searchUrl: 'https://www.tickertape.in/mutualfunds',
    enabled: true
  },
  {
    name: 'Zerodha Coin',
    priority: 2,
    scraper: scrapeZerodhaCoin,
    searchUrl: 'https://coin.zerodha.com',
    enabled: true
  },
  {
    name: 'ValueResearch',
    priority: 3,
    scraper: scrapeValueResearch,
    searchUrl: 'https://www.valueresearchonline.com',
    enabled: true
  },
  {
    name: 'MoneyControl',
    priority: 4,
    scraper: scrapeMoneyControl,
    searchUrl: 'https://www.moneycontrol.com/mutual-funds',
    enabled: true
  },
  {
    name: 'BSE India',
    priority: 5,
    scraper: scrapeBSE,
    searchUrl: 'https://www.bseindia.com',
    enabled: true
  },
  {
    name: 'NSE India',
    priority: 6,
    scraper: scrapeNSE,
    searchUrl: 'https://www.nseindia.com',
    enabled: true
  }
];

/**
 * Main function to scrape mutual fund data from multiple sources
 * @param {string} schemeName - The scheme name to search for
 * @param {number} schemeCode - The scheme code for backup search
 * @returns {Promise<Object>} Scraped data including AUM and holdings
 */
async function scrapeMutualFundDataMultiSource(schemeName, schemeCode) {
  try {
    const cacheKey = `multi-${schemeCode}-${schemeName}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📋 Using cached multi-source data for ${schemeName}`);
        return cached.data;
      }
      cache.delete(cacheKey);
    }

    console.log(`🔍 Starting multi-source scraping for: ${schemeName}`);

    // Sort sources by priority
    const enabledSources = DATA_SOURCES
      .filter(source => source.enabled)
      .sort((a, b) => a.priority - b.priority);

    let lastError = null;
    let attempts = [];

    // Try each source in order of priority
    for (const source of enabledSources) {
      try {
        console.log(`🌐 Trying source: ${source.name}`);
        
        const startTime = Date.now();
        const result = await source.scraper(schemeName, schemeCode);
        const duration = Date.now() - startTime;
        
        attempts.push({
          source: source.name,
          success: result.available,
          duration: duration,
          error: result.available ? null : result.message
        });

        if (result.available && (result.aum > 0 || result.holdings.length > 0)) {
          console.log(`✅ Successfully scraped from ${source.name}: AUM=${result.aum}, Holdings=${result.holdings.length}`);
          
          const enhancedResult = {
            ...result,
            source: source.name,
            priority: source.priority,
            attempts: attempts,
            scrapedAt: new Date().toISOString()
          };

          // Cache successful result
          cache.set(cacheKey, {
            data: enhancedResult,
            timestamp: Date.now()
          });

          return enhancedResult;
        } else {
          console.warn(`⚠️ ${source.name} returned no data`);
        }

      } catch (error) {
        lastError = error;
        attempts.push({
          source: source.name,
          success: false,
          duration: Date.now() - Date.now(),
          error: error.message
        });
        console.warn(`⚠️ ${source.name} failed:`, error.message);
      }
    }

    // If all sources failed, return comprehensive error info
    console.error(`❌ All sources failed for ${schemeName}`);
    return {
      aum: null,
      holdings: [],
      source: 'All Sources Failed',
      available: false,
      message: `Unable to fetch holdings data from any source. Tried ${attempts.length} sources.`,
      status: 'ALL_SOURCES_FAILED',
      attempts: attempts,
      lastError: lastError?.message,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Multi-source scraping failed for ${schemeName}:`, error.message);
    return getPlaceholderData(`Multi-source error: ${error.message}`);
  }
}

/**
 * TickerTape Scraper
 */
async function scrapeTickerTape(schemeName, schemeCode) {
  try {
    console.log(`🎯 Scraping TickerTape for: ${schemeName}`);
    
    // Clean scheme name for search
    const searchQuery = cleanSchemeNameForSearch(schemeName);
    const searchUrl = `https://www.tickertape.in/mutualfunds/search?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: getCommonHeaders()
    });

    const $ = cheerio.load(response.data);
    
    // Look for fund links
    let fundUrl = null;
    $('a[href*="/mutualfunds/"]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (text && isNameMatch(text, schemeName)) {
        fundUrl = href.startsWith('http') ? href : `https://www.tickertape.in${href}`;
        return false; // Break loop
      }
    });

    if (!fundUrl) {
      return getPlaceholderData('Fund not found on TickerTape');
    }

    // Scrape fund details
    const fundResponse = await axios.get(fundUrl, {
      timeout: 20000,
      headers: getCommonHeaders()
    });

    const fundPage = cheerio.load(fundResponse.data);
    
    // Extract AUM
    let aum = null;
    fundPage('[data-testid*="aum"], .aum, [class*="aum"]').each((i, element) => {
      const text = fundPage(element).text();
      const parsedAum = parseAUM(text);
      if (parsedAum > 0) {
        aum = parsedAum;
        return false;
      }
    });

    // Extract Holdings
    const holdings = [];
    fundPage('table, [data-testid*="holding"], [class*="holding"]').each((i, table) => {
      fundPage(table).find('tr').each((j, row) => {
        if (holdings.length >= 10) return false;
        
        const cells = fundPage(row).find('td');
        if (cells.length >= 2) {
          const company = fundPage(cells[0]).text().trim();
          const percentageText = fundPage(cells[1]).text().trim();
          const percentage = parsePercentage(percentageText);
          
          if (company && percentage > 0 && company.length > 2) {
            holdings.push({
              company: company,
              allocation: percentage
            });
          }
        }
      });
    });

    return {
      aum: aum,
      holdings: holdings.slice(0, 10),
      available: aum > 0 || holdings.length > 0
    };

  } catch (error) {
    return getPlaceholderData(`TickerTape error: ${error.message}`);
  }
}

/**
 * Zerodha Coin Scraper
 */
async function scrapeZerodhaCoin(schemeName, schemeCode) {
  try {
    console.log(`🪙 Scraping Zerodha Coin for: ${schemeName}`);
    
    const searchQuery = cleanSchemeNameForSearch(schemeName);
    
    // Try direct fund page if we can construct URL
    const fundSlug = searchQuery.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const fundUrl = `https://coin.zerodha.com/funds/${fundSlug}`;
    
    const response = await axios.get(fundUrl, {
      timeout: 15000,
      headers: getCommonHeaders(),
      validateStatus: (status) => status < 500 // Accept 404 but not 500+
    });

    if (response.status === 404) {
      // Try search instead
      return await searchZerodhaCoin(searchQuery);
    }

    const $ = cheerio.load(response.data);
    
    // Extract AUM
    let aum = null;
    $('[class*="aum"], [class*="fund-size"], .fund-info').each((i, element) => {
      const text = $(element).text();
      const parsedAum = parseAUM(text);
      if (parsedAum > 0) {
        aum = parsedAum;
        return false;
      }
    });

    // Extract Holdings
    const holdings = [];
    $('.holdings-table, [class*="holding"]').find('tr').each((i, row) => {
      if (holdings.length >= 10) return false;
      
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

    return {
      aum: aum,
      holdings: holdings.slice(0, 10),
      available: aum > 0 || holdings.length > 0
    };

  } catch (error) {
    return getPlaceholderData(`Zerodha Coin error: ${error.message}`);
  }
}

/**
 * Search Zerodha Coin when direct URL fails
 */
async function searchZerodhaCoin(searchQuery) {
  try {
    // This would need to be implemented based on Zerodha's actual search API
    // For now, return placeholder
    return getPlaceholderData('Zerodha Coin search not implemented');
  } catch (error) {
    return getPlaceholderData(`Zerodha Coin search error: ${error.message}`);
  }
}

/**
 * ValueResearch Online Scraper
 */
async function scrapeValueResearch(schemeName, schemeCode) {
  try {
    console.log(`💎 Scraping ValueResearch for: ${schemeName}`);
    
    const searchQuery = cleanSchemeNameForSearch(schemeName);
    const searchUrl = `https://www.valueresearchonline.com/funds/search?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: getCommonHeaders()
    });

    const $ = cheerio.load(response.data);
    
    // Look for fund links in search results
    let fundUrl = null;
    $('a[href*="/funds/"]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (text && isNameMatch(text, schemeName)) {
        fundUrl = href.startsWith('http') ? href : `https://www.valueresearchonline.com${href}`;
        return false;
      }
    });

    if (!fundUrl) {
      return getPlaceholderData('Fund not found on ValueResearch');
    }

    // Scrape fund details
    const fundResponse = await axios.get(fundUrl, {
      timeout: 20000,
      headers: getCommonHeaders()
    });

    const fundPage = cheerio.load(fundResponse.data);
    
    // Extract AUM from ValueResearch format
    let aum = null;
    fundPage('.fund-basic-info, .fund-details, .fund-facts').each((i, section) => {
      fundPage(section).find('td, .value, .amount').each((j, element) => {
        const text = fundPage(element).text();
        if (text.toLowerCase().includes('aum') || text.toLowerCase().includes('fund size')) {
          const nextElement = fundPage(element).next();
          const aumText = nextElement.length ? nextElement.text() : text;
          const parsedAum = parseAUM(aumText);
          if (parsedAum > 0) {
            aum = parsedAum;
            return false;
          }
        }
      });
    });

    // Extract Holdings
    const holdings = [];
    fundPage('.portfolio-table, .holdings-table, .top-holdings').find('tr').each((i, row) => {
      if (holdings.length >= 10) return false;
      
      const cells = fundPage(row).find('td');
      if (cells.length >= 2) {
        const company = fundPage(cells[0]).text().trim();
        const percentageText = fundPage(cells[1]).text().trim();
        const percentage = parsePercentage(percentageText);
        
        if (company && percentage > 0 && company.length > 2 && !company.toLowerCase().includes('total')) {
          holdings.push({
            company: company,
            allocation: percentage
          });
        }
      }
    });

    return {
      aum: aum,
      holdings: holdings.slice(0, 10),
      available: aum > 0 || holdings.length > 0
    };

  } catch (error) {
    return getPlaceholderData(`ValueResearch error: ${error.message}`);
  }
}

/**
 * MoneyControl Scraper (Enhanced version of original)
 */
async function scrapeMoneyControl(schemeName, schemeCode) {
  try {
    console.log(`💰 Scraping MoneyControl for: ${schemeName}`);
    
    const searchQuery = cleanSchemeNameForSearch(schemeName);
    const searchUrl = `https://www.moneycontrol.com/mutual-funds/search?search=${encodeURIComponent(searchQuery)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: getCommonHeaders()
    });

    const $ = cheerio.load(response.data);
    
    // Look for fund links
    let fundUrl = null;
    $('a[href*="/mutual-funds/"]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (text && isNameMatch(text, schemeName)) {
        fundUrl = href.startsWith('http') ? href : `https://www.moneycontrol.com${href}`;
        return false;
      }
    });

    if (!fundUrl) {
      return getPlaceholderData('Fund not found on MoneyControl');
    }

    // Scrape fund details (reuse existing logic)
    const fundResponse = await axios.get(fundUrl, {
      timeout: 20000,
      headers: getCommonHeaders()
    });

    const fundPage = cheerio.load(fundResponse.data);

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
      const element = fundPage(selector);
      if (element.length) {
        const nextCell = element.next('td');
        const aumText = nextCell.length ? nextCell.text() : element.text();
        aum = parseAUM(aumText);
        if (aum > 0) break;
      }
    }

    // Extract Holdings (reuse existing logic)
    const holdings = [];
    const holdingSelectors = [
      'table:contains("Holdings") tr',
      'table:contains("Portfolio") tr',
      'table:contains("Top") tr',
      '.holdings-table tr',
      '.portfolio-table tr'
    ];

    for (const selector of holdingSelectors) {
      const rows = fundPage(selector);
      if (rows.length > 1) {
        rows.each((i, row) => {
          if (holdings.length >= 10) return false;
          
          const cells = fundPage(row).find('td');
          if (cells.length >= 2) {
            const company = fundPage(cells[0]).text().trim();
            const percentageText = fundPage(cells[1]).text().trim();
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

    return {
      aum: aum,
      holdings: holdings.slice(0, 10),
      available: aum > 0 || holdings.length > 0
    };

  } catch (error) {
    return getPlaceholderData(`MoneyControl error: ${error.message}`);
  }
}

/**
 * BSE India Scraper
 */
async function scrapeBSE(schemeName, schemeCode) {
  try {
    console.log(`🏛️ Scraping BSE for: ${schemeName}`);
    
    // BSE might have different URL structure
    const searchUrl = `https://www.bseindia.com/mutual-fund/search?q=${encodeURIComponent(schemeName)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: getCommonHeaders()
    });

    // This would need to be implemented based on BSE's actual structure
    return getPlaceholderData('BSE scraper not fully implemented');

  } catch (error) {
    return getPlaceholderData(`BSE error: ${error.message}`);
  }
}

/**
 * NSE India Scraper
 */
async function scrapeNSE(schemeName, schemeCode) {
  try {
    console.log(`🏢 Scraping NSE for: ${schemeName}`);
    
    // NSE might have different URL structure
    const searchUrl = `https://www.nseindia.com/mutual-fund/search?q=${encodeURIComponent(schemeName)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: getCommonHeaders()
    });

    // This would need to be implemented based on NSE's actual structure
    return getPlaceholderData('NSE scraper not fully implemented');

  } catch (error) {
    return getPlaceholderData(`NSE error: ${error.message}`);
  }
}

/**
 * Utility Functions
 */

function cleanSchemeNameForSearch(schemeName) {
  return schemeName
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4) // Take first 4 words
    .join(' ');
}

function isNameMatch(text, targetName) {
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const cleanTarget = targetName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  
  const textWords = cleanText.split(' ').filter(w => w.length > 2);
  const targetWords = cleanTarget.split(' ').filter(w => w.length > 2);
  
  // Check if at least 60% of words match
  const matches = targetWords.filter(word => 
    textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
  );
  
  return matches.length >= Math.ceil(targetWords.length * 0.6);
}

function getCommonHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  };
}

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

function getPlaceholderData(reason = 'Scraping failed') {
  return {
    aum: null,
    holdings: [],
    source: 'Not Available',
    available: false,
    message: reason,
    status: 'SCRAPING_FAILED',
    lastAttempt: new Date().toISOString()
  };
}

/**
 * Clear the scraping cache
 */
function clearCache() {
  cache.clear();
  console.log('🧹 Multi-source scraper cache cleared');
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

module.exports = {
  scrapeMutualFundDataMultiSource,
  clearCache,
  getCacheStats,
  DATA_SOURCES
};