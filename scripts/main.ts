import puppeteer from 'puppeteer';
import { PuppeteerWebBaseLoader, Browser, Page } from '@langchain/community/document_loaders/web/puppeteer';

const scrapeUrls = [
    "https://ja.wikipedia.org/wiki/Category:2024%E5%B9%B4%E3%81%AE%E3%83%86%E3%83%AC%E3%83%93%E3%82%A2%E3%83%8B%E3%83%A1",
];

const scrapePage = async () => {
  const pageData = [];
  for await (const url of scrapeUrls) {
    try {
      const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        gotoOptions: {
          waitUntil: "domcontentloaded",
        },
        evaluate: async (page: Page, browser: Browser) => {
          const result = await page.evaluate(() => document.body.innerHTML);
          await browser.close();
          return result;
        },
      });
  
      const data = await loader.scrape();
      pageData.push(data);
    } catch (e) {
      console.error(e);
    }
  }
  return pageData;
};

(async () => {
  const data = await scrapePage();
  console.log(data);
})();
