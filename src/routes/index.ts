import { Router } from 'express';
import { fullCrawlSite } from './Crawl';
import { getAllUsers, addOneUser, updateOneUser, deleteOneUser } from './Users';


// User-route
const userRouter = Router();
userRouter.get('/all', getAllUsers);
userRouter.post('/add', addOneUser);
userRouter.put('/update', updateOneUser);
userRouter.delete('/delete/:id', deleteOneUser);


// Crawl route
const crawlRouter = Router();
crawlRouter.post("/full", fullCrawlSite);

// Export the base-router
const baseRouter = Router();
baseRouter.use('/users', userRouter);
baseRouter.use("/crawl", crawlRouter);
export default baseRouter;
