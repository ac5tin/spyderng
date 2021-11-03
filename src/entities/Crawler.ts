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
                timestamp: 0,
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
                if (r.summary === "") {
                    r.summary = loadedHTML("body").text().substring(0, 200);
                }
            }
            // --- MAIN CONTENT ---
            {
                let mainNodes = loadedHTML("main");
                if (mainNodes.length === 0) {
                    mainNodes = loadedHTML("[id^=content]");
                }
                if (mainNodes.length === 0) {
                    mainNodes = loadedHTML("[id^=main]");
                }
                if (mainNodes.length === 0) {
                    mainNodes = loadedHTML("[id^=article]");
                }
                // final fallback
                if (mainNodes.length === 0) {
                    mainNodes = loadedHTML("body");
                    mainNodes.remove("header");
                    mainNodes.remove("footer ~ *");
                    mainNodes.remove("footer");
                }
                if (mainNodes.length > 0) {
                    // styling
                    mainNodes.remove("style");
                    // navigation
                    mainNodes.remove("nav");
                    mainNodes.remove("[role=navigation]");
                    // script
                    mainNodes.remove("script");
                    mainNodes.remove("noscript");
                    // ads
                    mainNodes.remove("ins");
                    mainNodes.remove("[class*=adsbygoogle]");
                    mainNodes.remove("[class*=ad-]");
                    mainNodes.remove("[data-ad-client]");
                    mainNodes.remove(".ad");
                    mainNodes.remove(".ads");
                    mainNodes.remove(".advert");
                    r.mainContent = mainNodes.text();
                }
            }
            // --- AUTHOR ---
            {
                r.author = loadedHTML("meta[itemprop=author][content]").attr("content") ?? "";
                if (r.author === "") {
                    r.author = loadedHTML("meta[name=author][content]").attr("content") ?? "";
                }
                if (r.author === "") {
                    r.author = loadedHTML("meta[name=cse_author][content]").attr("content") ?? "";
                }
            }
            // --- TIMESTAMP ---
            {
                let ts = loadedHTML("meta[itemprop=datePublished][content]").attr("content") ?? "";
                if (ts === "") {
                    ts = loadedHTML("meta[name=date][content]").attr("content") ?? "";
                }
                if (ts === "") {
                    ts = loadedHTML("meta[name=cse_date][content]").attr("content") ?? "";
                }
                if (ts === "") {
                    ts = loadedHTML("meta[name=pubdate][content]").attr("content") ?? "";
                }
                if (ts === "") {
                    ts = loadedHTML("meta[name=article:published_time][content]").attr("content") ?? "";
                }
                if (ts === "") {
                    ts = loadedHTML("meta[property$=updated_time][content]").attr("content") ?? "";
                }
                if (ts !== "") {
                    r.timestamp = new Date(ts).getTime() / 1000;
                }
            }
            return r;
        } catch (err) { throw err }
    }
}



export const C: Crawler = new Crawler();

export default Crawler;
