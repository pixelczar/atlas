#!/usr/bin/env node

/**
 * Screenshot & Upload Script
 * Uses Puppeteer to capture page screenshots and upload to Firebase Storage
 *
 * Usage: node scripts/screenshot-upload.js [urls.json]
 * Example: node scripts/screenshot-upload.js scripts/urls.json
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const INPUT_FILE = process.argv[2] || path.join(__dirname, 'urls.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const MAX_CONCURRENT = 3; // Number of concurrent screenshots
const VIEWPORT = { width: 1280, height: 720 };

/**
 * Ensure screenshot directory exists
 */
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Capture screenshot of a URL
 */
async function captureScreenshot(browser, url, filename) {
  const page = await browser.newPage();
  
  try {
    await page.setViewport(VIEWPORT);
    
    console.log(`📸 Capturing: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    const screenshotPath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ 
      path: screenshotPath, 
      type: 'png',
      fullPage: false 
    });
    
    console.log(`✅ Saved: ${filename}`);
    return { url, filename, path: screenshotPath, success: true };
  } catch (error) {
    console.error(`❌ Failed to capture ${url}:`, error.message);
    return { url, filename, error: error.message, success: false };
  } finally {
    await page.close();
  }
}

/**
 * Process URLs in batches
 */
async function processBatch(browser, urls, batchSize) {
  const results = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map((entry, index) => {
      const filename = `screenshot-${i + index + 1}.png`;
      return captureScreenshot(browser, entry.url, filename);
    });
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting screenshot capture...\n');
    
    // Ensure screenshot directory exists
    await ensureDir(SCREENSHOT_DIR);
    
    // Read URLs from JSON file
    console.log(`📖 Reading URLs from: ${INPUT_FILE}`);
    const data = await fs.readFile(INPUT_FILE, 'utf-8');
    const { urls } = JSON.parse(data);
    
    if (!urls || urls.length === 0) {
      console.error('❌ No URLs found in input file');
      process.exit(1);
    }
    
    console.log(`✅ Found ${urls.length} URLs to capture\n`);
    
    // Launch browser
    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Process URLs
    const results = await processBatch(browser, urls, MAX_CONCURRENT);
    
    // Close browser
    await browser.close();
    
    // Save results
    const output = {
      capturedAt: new Date().toISOString(),
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results,
    };
    
    const outputFile = path.join(__dirname, 'screenshot-results.json');
    await fs.writeFile(outputFile, JSON.stringify(output, null, 2));
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total: ${output.total}`);
    console.log(`  Successful: ${output.successful}`);
    console.log(`  Failed: ${output.failed}`);
    console.log(`\n💾 Results saved to: ${outputFile}`);
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    
    console.log('\n✨ Done!');
    console.log('\n⚠️  Note: To upload to Firebase Storage, implement the upload logic using Firebase Admin SDK');
    console.log('   See: https://firebase.google.com/docs/storage/admin/start');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
