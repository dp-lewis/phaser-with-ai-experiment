const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  // Check for Phaser canvas inside #game-container
  const canvas = await page.$('#game-container canvas');
  if (canvas) {
    console.log('✅ Smoke test passed: Phaser canvas found.');
    process.exit(0);
  } else {
    console.error('❌ Smoke test failed: Phaser canvas not found.');
    process.exit(1);
  }
  await browser.close();
})();
