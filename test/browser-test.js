#!/usr/bin/env node
/**
 * MemoryVault Pro - Browser Automation Test Suite
 * Tests all user flows with real browser interactions
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'https://memoryvault-pro.vercel.app';
const LOCAL_URL = 'http://localhost:5173';

// Test results storage
const results = {
  passed: [],
  failed: [],
  screenshots: [],
  startTime: new Date().toISOString()
};

async function takeScreenshot(page, name) {
  const screenshotPath = `/tmp/memoryvault-test-${name}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  results.screenshots.push({ name, path: screenshotPath });
  return screenshotPath;
}

async function logResult(testName, passed, details = '') {
  const result = {
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (passed) {
    results.passed.push(result);
    console.log(`✅ PASS: ${testName}`);
  } else {
    results.failed.push(result);
    console.log(`❌ FAIL: ${testName} - ${details}`);
  }
}

// Browser Agent - Performs browser actions
async function browserAgent(action, params = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    switch(action) {
      case 'goto':
        await page.goto(params.url, { waitUntil: 'networkidle' });
        const title = await page.title();
        return { status: 'success', url: page.url(), title };
        
      case 'click':
        await page.click(params.selector, { timeout: 5000 });
        return { status: 'success' };
        
      case 'fill':
        await page.fill(params.selector, params.value, { timeout: 5000 });
        return { status: 'success' };
        
      case 'screenshot':
        const path = await takeScreenshot(page, params.name);
        return { status: 'success', path };
        
      case 'exists':
        const exists = await page.locator(params.selector).count() > 0;
        return { status: 'success', exists };
        
      case 'text':
        const text = await page.locator(params.selector).textContent();
        return { status: 'success', text: text?.trim() };
        
      case 'evaluate':
        const result = await page.evaluate(params.script);
        return { status: 'success', result };
        
      default:
        return { status: 'error', message: 'Unknown action' };
    }
  } catch (error) {
    const errorScreenshot = await takeScreenshot(page, `error-${action}`);
    return { 
      status: 'fail', 
      error: error.message,
      screenshot: errorScreenshot
    };
  } finally {
    await browser.close();
  }
}

// Vision Agent - Analyzes screenshots
async function visionAgent(imagePath) {
  // In real implementation, would use vision model
  // For now, return basic info
  return {
    analyzed: true,
    path: imagePath,
    note: 'Screenshot captured for visual analysis'
  };
}

// Test 1: Homepage Load
async function testHomepageLoad() {
  console.log('\n📋 TEST 1: Homepage Load');
  
  const result = await browserAgent('goto', { url: BASE_URL });
  
  if (result.status === 'success') {
    await logResult('Homepage Load', true, `Title: ${result.title}`);
    return true;
  } else {
    await logResult('Homepage Load', false, result.error);
    return false;
  }
}

// Test 2: Hero Section Visibility
async function testHeroSection() {
  console.log('\n📋 TEST 2: Hero Section');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Check for key hero elements
    const checks = [
      { name: 'Main Heading', selector: 'h1' },
      { name: 'Connect Wallet Button', selector: 'text=Connect Wallet, button' },
      { name: 'Features Link', selector: 'text=Features' }
    ];
    
    let allPassed = true;
    for (const check of checks) {
      const exists = await page.locator(check.selector).first().isVisible().catch(() => false);
      if (!exists) {
        await logResult(`Hero - ${check.name}`, false, 'Element not visible');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      const headingText = await page.locator('h1').first().textContent();
      await logResult('Hero Section', true, `Heading: "${headingText?.substring(0, 50)}..."`);
    }
    
    await takeScreenshot(page, 'hero-section');
    
  } catch (error) {
    await logResult('Hero Section', false, error.message);
  } finally {
    await browser.close();
  }
}

// Test 3: Features Section
async function testFeaturesSection() {
  console.log('\n📋 TEST 3: Features Section');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Scroll to features
    await page.evaluate(() => {
      const features = document.querySelector('#features, [id*="feature"]');
      if (features) features.scrollIntoView();
    });
    
    await page.waitForTimeout(500);
    
    // Check for feature cards
    const featureCards = await page.locator('.feature-card, .glass-card').count();
    
    if (featureCards >= 3) {
      await logResult('Features Section', true, `${featureCards} feature cards found`);
    } else {
      await logResult('Features Section', false, `Only ${featureCards} cards found, expected 3+`);
    }
    
    await takeScreenshot(page, 'features-section');
    
  } catch (error) {
    await logResult('Features Section', false, error.message);
  } finally {
    await browser.close();
  }
}

// Test 4: Navigation Links
async function testNavigation() {
  console.log('\n📋 TEST 4: Navigation');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Check navigation links exist
    const navLinks = await page.locator('nav a, .nav-link').count();
    
    // Try to find and click on features link
    const featuresLink = await page.locator('text=Features').first();
    if (await featuresLink.isVisible().catch(() => false)) {
      await featuresLink.click();
      await page.waitForTimeout(500);
      await logResult('Navigation - Features Link', true);
    } else {
      await logResult('Navigation - Features Link', false, 'Link not found');
    }
    
    await takeScreenshot(page, 'navigation');
    
  } catch (error) {
    await logResult('Navigation', false, error.message);
  } finally {
    await browser.close();
  }
}

// Test 5: Mobile Responsiveness
async function testMobileResponsiveness() {
  console.log('\n📋 TEST 5: Mobile Responsiveness');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Test mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    const page = await context.newPage();
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Check if content is visible and not broken
    const heading = await page.locator('h1').first();
    const isVisible = await heading.isVisible().catch(() => false);
    
    if (isVisible) {
      await logResult('Mobile Responsiveness', true, '375x667 viewport renders correctly');
    } else {
      await logResult('Mobile Responsiveness', false, 'Content not visible on mobile');
    }
    
    await takeScreenshot(page, 'mobile-view');
    
  } catch (error) {
    await logResult('Mobile Responsiveness', false, error.message);
  } finally {
    await browser.close();
  }
}

// Test 6: Performance Metrics
async function testPerformance() {
  console.log('\n📋 TEST 6: Performance Metrics');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime,
        loadComplete: nav?.loadEventEnd - nav?.startTime
      };
    });
    
    const passed = loadTime < 5000; // Should load in under 5 seconds
    await logResult(
      'Performance',
      passed,
      `Load time: ${loadTime}ms, DOMContentLoaded: ${Math.round(metrics.domContentLoaded)}ms`
    );
    
  } catch (error) {
    await logResult('Performance', false, error.message);
  } finally {
    await browser.close();
  }
}

// Test 7: Console Errors
async function testConsoleErrors() {
  console.log('\n📋 TEST 7: Console Errors');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for any async errors
    
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('source map') &&
      !e.includes('chrome-extension')
    );
    
    if (criticalErrors.length === 0) {
      await logResult('Console Errors', true, `No critical errors (${errors.length} filtered)`);
    } else {
      await logResult('Console Errors', false, `${criticalErrors.length} errors: ${criticalErrors[0]}`);
    }
    
  } catch (error) {
    await logResult('Console Errors', false, error.message);
  } finally {
    await browser.close();
  }
}

// Test 8: Wallet Connection UI
async function testWalletUI() {
  console.log('\n📋 TEST 8: Wallet Connection UI');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Look for wallet connection elements
    const walletSelectors = [
      'text=Connect Wallet',
      'text=Launch App',
      '[data-testid="connect-wallet"]',
      'button:has-text("Connect")'
    ];
    
    let found = false;
    for (const selector of walletSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found = true;
        break;
      }
    }
    
    if (found) {
      await logResult('Wallet Connection UI', true, 'Connect wallet button found');
    } else {
      await logResult('Wallet Connection UI', false, 'No wallet connection button found');
    }
    
  } catch (error) {
    await logResult('Wallet Connection UI', false, error.message);
  } finally {
    await browser.close();
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MemoryVault Pro - Browser Automation Test Suite');
  console.log('  Target URL:', BASE_URL);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  await testHomepageLoad();
  await testHeroSection();
  await testFeaturesSection();
  await testNavigation();
  await testMobileResponsiveness();
  await testPerformance();
  await testConsoleErrors();
  await testWalletUI();
  
  // Generate report
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📸 Screenshots: ${results.screenshots.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Save results
  const reportPath = '/tmp/memoryvault-test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}`);
  
  // List screenshots
  if (results.screenshots.length > 0) {
    console.log('\n📸 Screenshots captured:');
    results.screenshots.forEach(s => console.log(`  - ${s.name}: ${s.path}`));
  }
  
  return results;
}

// Run tests
runAllTests().catch(console.error);
