import Puppeteer from "puppeteer-extra";
import { Browser, PuppeteerNode } from "puppeteer-core";
import { Results } from "@interfaces/results";
import cheerio from "cheerio";

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
    raw = async (url: string): Promise<string> => {
        try {
            const page = await this.#browser?.newPage();
            await page?.goto(url, { waitUntil: "networkidle0" });
            const html = await page?.evaluate(() => document.documentElement.outerHTML);
            await page?.close();
            return html ?? "";
        } catch (err) { throw err }
    }


    full = async (url: string): Promise<Results> => {
        try {
            const r: Results = {
                rawHTML: "",
                url: "",
                title: "",
                summary: "",
                mainContent: "",
                author: "",
                timestamp: "",
                site: "",
                country: "",
                lang: "",
                type: "",
                relatedInternalLinks: [],
                relatedExternalLinks: [],
                tokens: [],
            };

            // - LOAD PAGE -
            const html = await this.raw(url);
            const loadedHTML = cheerio.load(html);

            // --- URL ---
            r.url = url;
            // --- RAW HTML ---
            r.rawHTML = html;
            // --- TITLE ---
            {
                r.title = loadedHTML("title").text();
            }
            // --- SUMMARY ---
            {
                r.summary = loadedHTML("meta[itemprop=description][content]").attr("content") ?? "";
                if (r.summary === "") {
                    r.summary = loadedHTML("meta[name=description][content]").attr("content") ?? "";
                }
                if (r.summary === "") {
                    r.summary = loadedHTML("meta[name=cse_summary][content]").attr("content") ?? "";
                }
            }
            // --- MAIN CONTENT ---

            return r;
        } catch (err) { throw err }
    }
}



export const C: Crawler = new Crawler();

export default Crawler;
