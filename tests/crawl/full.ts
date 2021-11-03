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

        // summary
        console.log(`summary: ${results.summary}`);
        expect(results.summary).not.eq("");

        // main content
        console.log(`main content: ${results.mainContent}`);
        expect(results.mainContent).not.eq("");
    });
});
