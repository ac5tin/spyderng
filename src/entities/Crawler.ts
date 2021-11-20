import Puppeteer from "puppeteer-extra";
import { Browser, PuppeteerNode } from "puppeteer-core";
import { Results } from "@interfaces/results";
import cheerio from "cheerio";
import Adblocker from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

class Crawler {
    #browser?: Browser;
    constructor() { }

    init = async (): Promise<void> => {
        try {
            Puppeteer.use(Adblocker({ blockTrackers: true }));
            Puppeteer.use(StealthPlugin());
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
        const page = await this.#browser?.newPage().catch(err => { throw err });
        try {
            await page?.goto(url, { waitUntil: "networkidle0" });
            const html = await page?.evaluate(() => document.documentElement.outerHTML);
            await page?.close();
            return html ?? "";
        } catch (err) { page?.close(); throw err }
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
                r.title = loadedHTML("title").first().text().replace(/\n/g, "").trim();
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

                // clean
                if (r.summary !== "") {
                    r.summary = r.summary.replace(/\n/g, "").trim();
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
                if (r.author === "") {
                    r.author = loadedHTML("[class$=author]").text() ?? "";
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
                if (ts === "") {
                    ts = loadedHTML(`[content^='${new Date().getUTCFullYear()}-']`).attr("content") ?? "";
                }
                if (ts === "") {
                    ts = loadedHTML("[datetime]").attr("datetime") ?? "";
                }
                if (ts === "") {
                    ts = loadedHTML("[id$=DateTime]").text() ?? "";
                }
                if (ts !== "") {
                    r.timestamp = new Date(ts).getTime() / 1000;
                }
            }
            // --- SITE ---
            {
                r.site = new URL(url).hostname;
            }
            // --- COUNTRY ---
            {
                r.country = loadedHTML("meta[itemprop=country][content]").attr("content") ?? "";
                if (r.country === "") {
                    r.country = loadedHTML("meta[name=geo.country][content]").attr("content") ?? "";
                }
                if (r.country === "") {
                    r.country = loadedHTML("meta[name=cse_country][content]").attr("content") ?? "";
                }
                if (r.country === "") {
                    r.country = loadedHTML("meta[name=geo.placename][content]").attr("content") ?? "";
                }
            }
            // --- LANGUAGE ---
            {
                r.lang = loadedHTML("meta[itemprop=inLanguage][content]").attr("content") ?? "";
                if (r.lang === "") {
                    r.lang = loadedHTML("meta[name=language][content]").attr("content") ?? "";
                }
                if (r.lang === "") {
                    r.lang = loadedHTML("html").attr("lang") ?? "";
                }
            }
            // --- TYPE ---
            {
            }
            // --- LINKS ---
            {
                const links = loadedHTML("a[href]");
                for (let i = 0; i < links.length; ++i) {
                    const link = links.eq(i);
                    const href = link.attr("href");
                    if (href !== undefined) {
                        if (href.length < 2) {
                            continue;
                        }
                        if (!href.startsWith("/") && !href.startsWith("http")) {
                            continue;
                        }
                        try {

                            const url = new URL(href);
                            if (url.hostname === r.site) {
                                // internal links
                                if (r.relatedInternalLinks.includes(url.href)) {
                                    continue;
                                }
                                r.relatedInternalLinks.push(url.href);
                            } else {
                                // external links
                                if (r.relatedExternalLinks.includes(url.href)) {
                                    continue;
                                }
                                r.relatedExternalLinks.push(url.href);
                            }

                        } catch (_) {
                            if (r.relatedInternalLinks.includes(href)) {
                                continue;
                            }
                            r.relatedInternalLinks.push(href);
                        }
                    }
                }

                for (let i = 0; i < r.relatedInternalLinks.length; ++i) {
                    const link = r.relatedInternalLinks[i];
                    if (link.startsWith("/")) {
                        r.relatedInternalLinks[i] = new URL(url).origin + link;
                    }
                }
                // clean get params
                for (let i = 0; i < r.relatedInternalLinks.length; ++i) {
                    const link = r.relatedInternalLinks[i];
                    if (link.includes("#")) {
                        r.relatedInternalLinks[i] = link.split("#")[0];
                    }
                    if (link.endsWith("/")) {
                        r.relatedInternalLinks[i] = link.slice(0, -1);
                    }
                    if (link.includes("&")) {
                        r.relatedInternalLinks[i] = link.split("&")[0];
                    }
                }
                for (let i = 0; i < r.relatedExternalLinks.length; ++i) {
                    const link = r.relatedExternalLinks[i];
                    if (link.includes("#")) {
                        r.relatedExternalLinks[i] = link.split("#")[0];
                    }
                    if (link.endsWith("/")) {
                        r.relatedExternalLinks[i] = link.slice(0, -1);
                    }
                    if (link.includes("&")) {
                        r.relatedExternalLinks[i] = link.split("&")[0];
                    }
                }


            }
            // tokens
            {
                if (r.tokens.length === 0) {
                    r.tokens = loadedHTML("meta[name=keywords][content]").attr("content")?.split(/[,、]/g).map(tk => tk.trim().toLocaleLowerCase()) ?? [];
                }
            }

            return r;
        } catch (err) { throw err }
    }
}



export const C: Crawler = new Crawler();

export default Crawler;
