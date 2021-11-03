import { describe } from "mocha";
import { expect } from "chai";
import Crawler from "../../src/entities/Crawler";
import { Results } from "../../src/@interfaces/results";


describe("Scrape full page HTML", function () {
    this.timeout(3000);
    it("Google UK", async () => {
        const c = new Crawler();
        await c.init();
        const results: Results = await c.full("https://www.google.co.uk");
        await c.close(); // close crawler

        // --- CHECK DATA ---

        // title
        console.log(`Title: ${results.title}`);
        expect(results.title).not.eq("");
        expect(results.title).eq("Google");
    });
});


describe("Extract full results from page", function () {
    this.timeout(30000);

    const urls: string[] = [
        "https://stackoverflow.com/questions/68230031/cannot-create-a-string-longer-than-0x1fffffe8-characters-in-json-parse",
        "https://www.epochconverter.com/",
        "https://github.com/trending",
        "https://m3o.com/db",
        "https://news.ycombinator.com/",
        "https://google.co.uk",
        "https://facebook.com",
        "https://www.reddit.com/",
        "https://yahoo.com",
        "https://youtube.com",
        "https://www.scmp.com/news/hong-kong/health-environment/article/3154589/hong-kong-students-showing-signs-depression-new?module=lead_hero_story&pgtype=homepage",
        "https://ai.facebook.com/blog/reskin-a-versatile-replaceable-low-cost-skin-for-ai-research-on-tactile-perception/",
        "https://www.reddit.com/r/golang/comments/opd6nk/puppeteer_equivalent_in_go/",
    ];

    for (let url of urls) {
        it(`Extract ${url}`, async () => {
            const c = new Crawler();
            await c.init();


            const results: Results = await c.full(url);
            await c.close(); // close crawler

            // --- CHECK DATA ---

            // title
            console.log(`Title: ${results.title}`);
            expect(results.title).not.eq("");

            // summary
            console.log(`summary: ${results.summary}`);
            expect(results.summary).not.eq("");

            // main content
            console.log(`main content: ${results.mainContent}`);
            expect(results.mainContent).not.eq("");

            // author
            console.log(`author: ${results.author}`);
            expect(results.author).not.eq("");

            // timestamp
            console.log(`timestamp: ${new Date(results.timestamp)}`);
            expect(results.timestamp).not.eq(0);

        });
    }


});