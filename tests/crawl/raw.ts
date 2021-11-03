import { describe } from "mocha";
import { expect } from "chai";
import Crawler from "../../src/entities/Crawler";


describe("Scrape Raw page HTML", function() {
    this.timeout(3000);
    it("Google UK", async () => {
        const c = new Crawler();
        await c.init();
        const html = await c.scrape("https://www.google.co.uk");
        await c.close(); // close crawler
        expect(html.length).greaterThanOrEqual(100);
    });
});
