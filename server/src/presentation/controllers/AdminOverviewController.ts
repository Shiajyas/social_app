import { Request, Response } from 'express';
import { IAdminOverviewService } from '../../useCase/interfaces/IAdminOverviewService';
import { HttpStatus,ResponseMessages } from '../../infrastructure/constants/adminConstants';

export class AdminOverviewController {
  constructor(private readonly service: IAdminOverviewService) {}

  getOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const range = (req.query.range as '7d' | '1m' | '1y') || '7d';
      const minLikes = Number(req.query.minLikes ?? 0);
      const maxLikes = Number(req.query.maxLikes ?? Infinity);

      const data = await this.service.getOverview(range, { min: minLikes, max: maxLikes });
      res.status(HttpStatus.OK).json(data);
    } catch (err) {
      console.error('Admin overview fetch error:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };

  getMostLikedPosts = async (req: Request, res: Response): Promise<void> => {
    try {
      const range = (req.query.range as '7d' | '1m' | '1y') || '7d';
      const minLikes = Number(req.query.minLikes ?? 0);
      const maxLikes = Number(req.query.maxLikes ?? Infinity);

      const posts = await this.service.getMostLikedPosts(range, { min: minLikes, max: maxLikes });
      res.status(HttpStatus.OK).json(posts);
    } catch (err) {
      console.error('Most liked posts fetch error:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };

  getReportedPosts = async (req: Request, res: Response): Promise<void> => {
    try {
      const range = (req.query.range as string) || '7d';
      const validRanges = ['7d', '1m', '1y'];

      if (!validRanges.includes(range)) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ResponseMessages.INVALID_RANGE });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1 || limit < 1) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ResponseMessages.INVALID_PAGINATION });
        return;
      }

      const posts = await this.service.getReportedPosts(range as '7d' | '1m' | '1y', page, limit);
      res.status(HttpStatus.OK).json(posts);
    } catch (err) {
      console.error('Error fetching reported posts:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };

  getReportedPostsCount = async (_: Request, res: Response): Promise<void> => {
    try {
      const count = await this.service.getReportedPostsCount();
      res.status(HttpStatus.OK).json({ count });
    } catch (err) {
      console.error('Error fetching reported posts count:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.INTERNAL_SERVER_ERROR });
    }
  };
}
