import { chromium, Browser, Page } from 'playwright';

export class BrowserService {
  private static instance: BrowserService;
  private browser: Browser | null = null;

  private constructor() {}

  public static getInstance(): BrowserService {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService();
    }
    return BrowserService.instance;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async browse(url: string, selector?: string): Promise<{ content: string; url: string }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (selector) {
        await page.waitForSelector(selector, { timeout: 10000 }).catch(() => null);
      }
      const content = await page.content();
      return { content, url: page.url() };
    } finally {
      await page.close();
    }
  }
}

export const browserService = BrowserService.getInstance();
