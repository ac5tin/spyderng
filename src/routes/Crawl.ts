import { C } from '@entities/Crawler';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const fullCrawlSite = async (req: Request, res: Response) => {
    try {
        let { url }: { url: string } = req.body;
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        const resp = await C.full(url);
        res.status(StatusCodes.OK).json({
            status: 'success',
            data: resp,
        });
        return;
    } catch (err) {
        console.error((err as Error).message);//debug
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: (err as Error).message,
        });
        return;
    }
}


export { fullCrawlSite };