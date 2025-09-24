import { Request, Response } from 'express';
import { IUserService } from '../../useCase/interfaces/IUserService';
import { getErrorMessage } from '../../infrastructure/utils/errorHelper';
import { IUser } from '../../core/domain/interfaces/IUser';
import { ISubscriptionUseCase } from '../../useCase/interfaces/ISubscriptionUseCase';
import { stripe } from '../../infrastructure/utils/stripe';
import { HttpStatus, ResponseMessages as Msg } from '../../infrastructure/constants/constants';
export class UserController {
  constructor(
    private _UserService: IUserService,
    private _SubscriptionUseCase: ISubscriptionUseCase
  ) {}

  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { user?: IUser }).user?.id;
      if (!userId){
        res.status(HttpStatus.BAD_REQUEST).json({ message: Msg.USER_ID_MISSING });
          return 
      }
      

      const suggestions = await this._UserService.getSuggestions(userId);
      res.status(HttpStatus.OK).json(suggestions);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async getFollowers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const followers = await this._UserService.getFollowers(id);
      res.status(HttpStatus.OK).json(followers);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async getFollowing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const following = await this._UserService.getFollowing(id);
      res.status(HttpStatus.OK).json(following);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async unfollowUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { user?: IUser }).user?.id;
      const { id: targetUserId } = req.params;

      if (!userId){

       res.status(HttpStatus.BAD_REQUEST).json({ message: Msg.USER_ID_MISSING }) 
        return ;
      }

      await this._UserService.unfollowUser(userId, targetUserId);
      res.status(HttpStatus.OK).json({ message: Msg.FOLLOW_SUCCESS });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userProfile = await this._UserService.getProfile(id);
      res.status(HttpStatus.OK).json(userProfile);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async getUserPost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userPost = await this._UserService.getUserPost(id);
      res.status(HttpStatus.OK).json(userPost);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async getUserSavedPost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userPost = await this._UserService.getUserSavedPost(id, 1, 10);
      res.status(HttpStatus.OK).json(userPost);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async updateUserprofile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const updatedData = req.body;

      if (req.file) {
        updatedData.avatar = (req.file as any).location;
      }

      const updatedUser = await this._UserService.updateUserProfile(userId, updatedData);
      res.status(HttpStatus.OK).json({ message: Msg.PROFILE_UPDATED, user: updatedUser });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.INTERNAL_ERROR });
    }
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
   
      const subscription = await this._SubscriptionUseCase.getUserSubscription(userId);

      if (!subscription){
        res.status(HttpStatus.NOT_FOUND).json({ message: Msg.SUBSCRIPTION_NOT_FOUND });
        return 
      }
        

      res.status(HttpStatus.OK).json(subscription);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.INTERNAL_ERROR });
    }
  }

  // Step 1: Create payment intent
  async subscribe(req: Request, res: Response): Promise<void> {
    const { userId, planId } = req.body;

      const plan = await this._SubscriptionUseCase.getPlanById(planId)

    try {
      const planAmount = plan?.amount; // Or fetch from DB using planId
      const currency = "usd";

      if (planAmount === undefined) {
  throw new Error('Plan amount is not defined');
}
      const paymentIntent = await stripe.paymentIntents.create({
        amount: planAmount,
        currency,
        metadata: { userId, planId },
        automatic_payment_methods: { enabled: true },
      });

      if (!paymentIntent.client_secret) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: Msg.PAYMENT_FAILED });
        return;
      }

      res.status(HttpStatus.OK).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: Msg.PAYMENT_ERROR });
    }
  }

  // Step 2: Confirm payment + create subscription
  async confirmSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId, planId, paymentIntentId } = req.body;


      // 🔑 Verify payment status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "Payment not completed" });
        return;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + 1);

      const subscription =
        await this._SubscriptionUseCase.createOrUpdateSubscription(
          userId,
          planId,
          startDate,
          endDate
        );

      res.status(HttpStatus.OK).json({
        message: Msg.SUBSCRIPTION_CONFIRMED,
        subscription,
      });
    } catch (error) {
      console.error("Error confirming subscription:", error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: Msg.SUBSCRIPTION_FAILED });
    }
  }

  async getPaymentIntent(req: Request, res: Response): Promise<void> {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({ paymentIntent });
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to retrieve payment intent" });
  }
}

  async getSubscriptionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      const history = await this._SubscriptionUseCase.getUserSubscriptionHistory(userId);
      res.status(HttpStatus.OK).json(history);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.INTERNAL_ERROR });
    }
  }

  async getCallHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      const history = await this._UserService.getCallHistory(userId);
      res.status(HttpStatus.OK).json(history);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.INTERNAL_ERROR });
    }
  }

  async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const fileUrls = files?.map((file) => (file as any).location);
      res.status(HttpStatus.OK).json({ fileUrls });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.FILE_UPLOAD_ERROR });
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.query as string;

      if (!query?.trim()) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: Msg.SEARCH_QUERY_EMPTY });
         return
      }

      const result = await this._UserService.searchUsers(query);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.INTERNAL_ERROR });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id : userId } = req.params;
      const { oldPassword, newPassword } = req.body;

      console.log(req.params)

     let result = await this._UserService.changePassword(userId,oldPassword, newPassword);
       if(result){
        res.status(HttpStatus.OK).json({ message: Msg.PASSWORD_CHANGED});
       }else{
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.PASSWORD_CHANGE_FAILED });
       }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.INTERNAL_SERVER_ERROR});
    }
  }

  async getAllPlans(req: Request, res: Response): Promise<void> {
    res.setHeader('Cache-Control', 'no-store'); 
  console.log(req.query,1236);
     try {
       const {
         search = '',
         status = 'all',
         startDate = '',
         endDate = '',
         page = '1',
         limit = '1000', // big number to fetch all
       } = req.query;
 
       const data = await this._SubscriptionUseCase.getAllPlans(
         { search: String(search), status: String(status), startDate: String(startDate), endDate: String(endDate) },
         parseInt(page as string),
         parseInt(limit as string),
       );
 
       console.log(data, 'getAllPlans');
 
       res.status(HttpStatus.OK).json(data);
     } catch (error) {
       console.error('getAllPlans error:', error);
       res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: Msg.INTERNAL_ERROR });
     }
  }
}
