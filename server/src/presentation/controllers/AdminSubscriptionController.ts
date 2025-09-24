import { Request, Response } from 'express';
import { IAdminSubscriptionService } from '../../useCase/interfaces/IAdminSubscriptionService';
import { HttpStatus, ResponseMessages } from '../../infrastructure/constants/constants';

export class AdminSubscriptionController {
  constructor(private readonly subscriptionService: IAdminSubscriptionService) {}

  // ✅ Fetch paginated plans

  getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.subscriptionService.getSubscriptionPlans();
      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      console.error('getSubscriptionPlans error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_FETCH_FAILED });
    }
  };

  getPlans = async (req: Request, res: Response): Promise<void> => {
  
    try {
      const {
        search = '',
        status = 'all',
        startDate = '',
        endDate = '',
        page = '1',
        limit = '10',
      } = req.query;

      const data = await this.subscriptionService.getPlans(
        { search: String(search), status: String(status), startDate: String(startDate), endDate: String(endDate) },
        parseInt(page as string),
        parseInt(limit as string),
      );

    

      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      console.error('getPlans error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_FETCH_FAILED });
    }
  };

  // ✅ Fetch all plans without pagination
  getAllPlans = async (req: Request, res: Response): Promise<void> => {
     
    try {
      const {
        search = '',
        status = 'all',
        startDate = '',
        endDate = '',
        page = '1',
        limit = '1000', // big number to fetch all
      } = req.query;

      const data = await this.subscriptionService.getAllPlans(
        { search: String(search), status: String(status), startDate: String(startDate), endDate: String(endDate) },
        parseInt(page as string),
        parseInt(limit as string),
      );

   

      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      console.error('getAllPlans error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_FETCH_FAILED });
    }
  };

  // ✅ Toggle plan active/inactive
  togglePlanStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const result = await this.subscriptionService.togglePlanStatus(id);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('togglePlanStatus error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_UPDATE_FAILED });
    }
  };

  // ✅ Create or update a plan
  createOrUpdatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, amount, duration, description, _id :planId} = req.body;
     
      const result = await this.subscriptionService.createOrUpdatePlan(name, amount, duration, description, planId);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('createOrUpdatePlan error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: ResponseMessages.SUBSCRIPTION_UPDATE_FAILED});
    }
  };
}
