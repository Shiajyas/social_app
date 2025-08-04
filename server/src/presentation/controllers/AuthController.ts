import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../../core/domain/interfaces/IUser';
import { getErrorMessage } from '../../infrastructure/utils/errorHelper';
import { setCookie } from '../../infrastructure/utils/setCookie';
import { IAuthService } from '../../useCase/interfaces/IAuthService';
import { AuthenticatdRequest } from '../../core/domain/interfaces/IAuthenticatedRequest';
import { IAdminUseCase } from '../../useCase/interfaces/IAdminUseCase';
import { HttpStatus, ResponseMessages } from '../../infrastructure/constants/constants';
declare module 'express-session' {
  interface Session {
    user?: IUser;
  }
}
export class AuthController {
  private _UserService: IAuthService;
  private _AdminService: IAdminUseCase

  constructor(userService: IAuthService, adminService: IAdminUseCase) {
    this._UserService = userService;  
    this._AdminService = adminService
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body;
      console.log(email)
   
    let loginResult;

    if (role === 'admin') {
      loginResult = await this._AdminService.login(email, password);
    } else {
      loginResult = await this._UserService.login(email, password, role);
    }

    if (!loginResult) {
      res.status(400).json({ message: 'Login failed.' });
      return;
    }
      req.session.user = loginResult.user as IUser;

      const { token, refreshToken, user } = loginResult;

      // Check if the user is a Mongoose document, and convert to plain object if so
      const userObject: IUser =
        user instanceof mongoose.Document ? user.toObject() : user;

      const userWithoutPassword = { ...userObject, password: undefined };
       setCookie(res, 'userToken', token);
     
       if ('role' in user && user.role !== 'admin') {
        setCookie(res, 'userToken', token);
       } else {
        setCookie(res, 'adminToken', token);
          }


      setCookie(res, 'refreshToken', refreshToken);

         res.status(HttpStatus.OK).json({
        msg: ResponseMessages.LOGIN_SUCCESS,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.BAD_REQUEST).json({ message: getErrorMessage(error) });
    
    }
  }

  async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await this._UserService.requestOtp(email);
      res.status(HttpStatus.OK).json({ msg: ResponseMessages.OTP_SENT});
    } catch (error) {
      console.log(getErrorMessage(error), 'error');

     res.status(HttpStatus.BAD_REQUEST).json({ msg: getErrorMessage(error) });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      await this._UserService.register(req.body);
         res.status(HttpStatus.CREATED).json({
        message: ResponseMessages.REGISTER_SUCCESS,
        email: req.body.email,
      });
    } catch (error) {
      console.log(getErrorMessage(error), 'error');

     res.status(HttpStatus.BAD_REQUEST).json({ message: getErrorMessage(error) });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId =
        (req as AuthenticatdRequest).user?.id ||
        (req as AuthenticatdRequest).admin?.id;

      console.log(userId, 'userId');

      if (!userId) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: ResponseMessages.INVALID_USER_REQUEST });
        return;
      }

      const getUser =
        (await this._UserService.getUser(userId)) ||
        (await this._AdminService.getUserById(userId));

      console.log(getUser, 'getUser');

      if (!getUser) {
        res.status(HttpStatus.NOT_FOUND).json({ message: ResponseMessages.USER_NOT_FOUND });
        return;
      }

      res.status(HttpStatus.OK).json(getUser);
    } catch (error) {
      console.error('getUser error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async verify_Otp(req: Request, res: Response): Promise<void> {
    try {
      const { email, enterdOtp } = req.body;

      const { userData, accessToken, refreshToken } =
        await this._UserService.verify_Otp(email, enterdOtp);

      setCookie(res, 'refreshToken', refreshToken);
      setCookie(res, 'userToken', accessToken);

      res.status(HttpStatus.OK).json({
        msg: ResponseMessages.OTP_VERIFIED,
        userData,
      });
    } catch (error) {
      console.error('verify_Otp error:', error);
      res.status(HttpStatus.BAD_REQUEST).json({ msg: getErrorMessage(error) });
    }
  }

async verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, enterdOtp } = req.body;

    const { accessToken, refreshToken, user } =
      await this._UserService.verifyOtp(email, enterdOtp);

    setCookie(res, 'refreshToken', refreshToken);
    setCookie(res, 'userToken', accessToken);

    res.status(HttpStatus.OK).json({
      message: ResponseMessages.OTP_VERIFIED,
      user,
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(HttpStatus.BAD_REQUEST).json({ message: getErrorMessage(error) });
  }
}

async resendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const success = await this._UserService.resendOtp(email);

    if (!success) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: ResponseMessages.OTP_SEND_FAILED });
      return;
    }

    res.status(HttpStatus.OK).json({
      message: ResponseMessages.OTP_SENT,
      success,
    });
  } catch (error) {
    console.error('Error in resendOtp:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}



async resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const success = await this._UserService.resetPassword(email, password);

    if (!success) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: ResponseMessages.RESET_PASSWORD_FAILED });
      return;
    }

    res.status(HttpStatus.CREATED).json({ message: ResponseMessages.RESET_PASSWORD_SUCCESS });
  } catch (error) {
    console.error(error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}


  async getAllUser(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1; // Default to page 1
      const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page

      const { users, totalUsers, totalPages } =
        await this._UserService.getAllUser(page, limit);

      if (!users) throw new Error('User list fetching failed');

      res.status(HttpStatus.OK).json({
      users,
      totalUsers,
      totalPages,
      currentPage: page,
    });
    } catch (error) {
      console.error(error);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }
  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      const { user, token, refreshToken } = (await this._UserService.googleAuth(
        idToken,
      )) as { user: IUser; token: string; refreshToken: string };

      setCookie(res, 'refreshToken', refreshToken);
      setCookie(res, 'userToken', token);
      if (!user) throw new Error('Google login faild');
      if (!token) throw new Error('Google login faild');
     

    res.status(HttpStatus.OK).json({
      message: ResponseMessages.GOOGLE_AUTH_SUCCESS,
      user,
    });
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const incomingRefreshToken = req.cookies.refreshToken;
      if (!incomingRefreshToken) {
        throw new Error('No refresh token found.');
      }
      const { token, role, refreshToken } =
        await this._UserService.refreshToken(incomingRefreshToken);
      if (!token || !role) {
        throw new Error('Failed to refresh token.');
      }

      setCookie(res, 'refreshToken', refreshToken);
      setCookie(res, 'userToken', token);
      res.status(HttpStatus.OK).json({ message: ResponseMessages.REFRESH_TOKEN_SUCCESS })
    } catch (error) {
      console.error(error, '>>>>');
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
    }
  }


async logout(req: Request, res: Response): Promise<void> {
  try {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });

    res.cookie('userToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy failed:', err);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: ResponseMessages.INTERNAL_ERROR,
        });
      }

      res.status(HttpStatus.OK).json({
        message: 'Logged out successfully.',
        ok: true,
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async adminLogout(req: Request, res: Response): Promise<void> {
  try {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });

    res.cookie('adminToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy failed:', err);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: ResponseMessages.INTERNAL_ERROR,
        });
      }

      res.status(HttpStatus.OK).json({
        message: 'Logged out successfully.',
        ok: true,
      });
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async blockUser(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId } = req.params;

    if (!userId) {
       res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ResponseMessages.INVALID_USER_REQUEST });
        return
    }

    const blockedUser = await this._UserService.blockUser(userId);

    if (!blockedUser) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Failed to block user.' });
         return
    }

    res.status(HttpStatus.OK).json({
      message: 'User blocked successfully.',
      user: blockedUser,
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}

async unblockUser(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId } = req.params;

    if (!userId) {
    res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ResponseMessages.INVALID_USER_REQUEST });
          return 
    }

    const unblockedUser = await this._UserService.unblockUser(userId);

    if (!unblockedUser) {
     res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Failed to unblock user.' });
         return 
    }

    res.status(HttpStatus.OK).json({
      message: 'User unblocked successfully.',
      user: unblockedUser,
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: getErrorMessage(error) });
  }
}


}
