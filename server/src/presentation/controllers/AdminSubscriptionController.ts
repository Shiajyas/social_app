// controllers/AdminSubscriptionController.ts

import { Request, Response } from 'express';
import { IAdminSubscriptionService } from '../../useCase/interfaces/IAdminSubscriptionService';
import { HttpStatus,ResponseMessages } from '../../infrastructure/constants/adminConstants';

export class AdminSubscriptionController {
  constructor(private readonly subscriptionService: IAdminSubscriptionService) {}

  getSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        search = '',
        status = 'all',
        startDate = '',
        endDate = '',
        page = '1',
        limit = '10',
      } = req.query;

      const data = await this.subscriptionService.getSubscriptions({
        search: String(search),
        status: String(status),
        startDate: String(startDate),
        endDate: String(endDate),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      console.error('getSubscriptions error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_FETCH_FAILED });
    }
  };

  getAllSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        search = '',
        status = 'all',
        startDate = '',
        endDate = '',
      } = req.query;

      const data = await this.subscriptionService.getAllSubscriptions({
        search: String(search),
        status: String(status),
        startDate: String(startDate),
        endDate: String(endDate),
      });

      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      console.error('getAllSubscriptions error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_FETCH_FAILED });
    }
  };

  updateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const result = await this.subscriptionService.toggleSubscriptionStatus(id);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('updateSubscription error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_UPDATE_FAILED });
    }
  };
}
