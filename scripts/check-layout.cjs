const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1000 });
  await page.goto('http://localhost:4500/auth.html');
  
  const rects = await page.evaluate(() => {
    return {
      rightPanel: document.querySelector('.auth-right-panel')?.getBoundingClientRect(),
      wrapper: document.querySelector('.auth-wrapper')?.getBoundingClientRect(),
      container: document.querySelector('.auth-container')?.getBoundingClientRect(),
      loginPanel: document.querySelector('.auth-login-panel')?.getBoundingClientRect()
    };
  });
  console.log(JSON.stringify(rects, null, 2));
  await browser.close();
})();
