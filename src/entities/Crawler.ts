import Puppeteer from "puppeteer-extra";
import { Browser, PuppeteerNode } from "puppeteer-core";

class Crawler {
    #browser?: Browser;
    constructor() { }

    init = async (): Promise<void> => {
        try {
            this.#browser = await (Puppeteer as unknown as PuppeteerNode).launch({
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--disable-gpu",
                    "--window-size=1920x1080",
                    "--lang=en-US,en;q=0.9",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process"
                ],
                executablePath: process.env.CHROMIUM_PATH,
                headless: true,
                ignoreHTTPSErrors: true,
            });
        } catch (err) { throw err }
    }

    close = async (): Promise<void> => {
        try {
            await this.#browser?.close();
            this.#browser = undefined;
        } catch (err) { throw err }
    }

    /** get full page HTML
     * @param url Page url
     * @return raw page html as string
    */
    scrape = async (url: string): Promise<string> => {
        try {
            const page = await this.#browser?.newPage();
            await page?.goto(url, { waitUntil: "networkidle0" });
            const html = await page?.evaluate(() => document.body.innerHTML);
            await page?.close();
            return html ?? "";
        } catch (err) { throw err }
    }
}



export const C: Crawler = new Crawler();

export default Crawler;
