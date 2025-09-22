const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function manualScreenerTest() {
  console.log('🧪 Manual Screener.in Test - Will open browser for you to test manually');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();

  // Test with a simple stock first
  const stockSymbol = 'RELIANCE';
  console.log(`🔍 Testing with ${stockSymbol}`);

  try {
    // Go to the main stock page
    console.log('📍 Step 1: Going to main stock page...');
    await page.goto(`https://www.screener.in/company/${stockSymbol}/`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully!');

    // Wait for user to manually find and test the export functionality
    console.log('\n🔍 MANUAL TEST INSTRUCTIONS:');
    console.log('1. Look at the browser window that just opened');
    console.log('2. Find the "Export to Excel" button or link');
    console.log('3. Try clicking it and see what happens');
    console.log('4. Check if a file downloads');
    console.log('5. Note the exact button text and location');
    console.log('\n⏳ Press Enter in this terminal when you\'re done testing...');

    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // Now let's try to find the export button programmatically
    console.log('\n🤖 Now testing programmatic detection...');

    // Get all clickable elements
    const clickableElements = await page.evaluate(() => {
      const elements = [];

      // Find all links and buttons
      const links = document.querySelectorAll('a, button, [onclick], .btn, .button');

      links.forEach(element => {
        const text = element.textContent?.trim() || '';
        const href = element.href || '';
        const className = element.className || '';
        const onclick = element.onclick || '';

        if (text.toLowerCase().includes('export') ||
            text.toLowerCase().includes('excel') ||
            text.toLowerCase().includes('download') ||
            href.includes('export') ||
            className.includes('export')) {

          elements.push({
            tagName: element.tagName,
            text: text,
            href: href,
            className: className,
            id: element.id || '',
            onclick: onclick.toString()
          });
        }
      });

      return elements;
    });

    console.log('\n📊 Found potential export elements:');
    clickableElements.forEach((el, index) => {
      console.log(`${index + 1}. ${el.tagName}: "${el.text}" (href: ${el.href}, class: ${el.className})`);
    });

    if (clickableElements.length === 0) {
      console.log('❌ No export elements found programmatically');

      // Let's also check for any hidden or dynamically generated elements
      console.log('\n🔍 Checking for dynamic content...');

      const allText = await page.evaluate(() => {
        return document.body.innerText;
      });

      if (allText.toLowerCase().includes('export')) {
        console.log('✅ Found "export" text in page content');
      } else {
        console.log('❌ No "export" text found in page content');
      }
    }

    console.log('\n🔍 What did you discover in your manual test?');
    console.log('1. Did you find an Export to Excel button?');
    console.log('2. What was the exact text on the button?');
    console.log('3. Did clicking it work?');
    console.log('4. What happened when you clicked it?');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }

  console.log('\n⏳ Press Enter to close browser...');
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });

  await browser.close();
  console.log('🔌 Browser closed');
}

if (require.main === module) {
  manualScreenerTest();
}

module.exports = manualScreenerTest;