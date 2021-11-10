import './pre-start'; // Must be the first import
import app from '@server';
import logger from '@shared/Logger';
import { C } from '@entities/Crawler';

// init crawler
// top level await not supported yet
(async () => {
    console.log("Initialising Crawler ...");
    await C.init().catch(err => {
        console.error(err.message);
        process.exit(1);
    });
    console.log("> Successfully initialised Crawler <");
})();


// Start the server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    logger.info('Express server started on port: ' + port);
});
