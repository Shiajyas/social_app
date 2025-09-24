import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { OtpService } from '../../../infrastructure/services/otpService';
import { IOtpService } from '../../../infrastructure/services/interfaces/IOtpService';
import { UserRepository } from '../../../data/repositories/UserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { AuthService } from '../../../useCase/authUsecase';
import { IAuthService } from '../../../useCase/interfaces/IAuthService';
import userAuthMiddleware from '../../middleware/userAuthMiddleware';
import { loginRateLimiter } from '../../middleware/rateLimitMiddleware';
import { IAdminUseCase } from '../../../useCase/interfaces/IAdminUseCase';
import { AdminUseCaseImpl } from '../../../useCase/adminUsecase';
import { IAdminRepository } from '../../../data/interfaces/IAdminRepository';
import { AdminRepository } from '../../../data/repositories/AdminRepository';

const router = Router();

const userRepository: IUserRepository = new UserRepository();
const otpService: IOtpService = new OtpService();
const userService: IAuthService = new AuthService(userRepository, otpService);

const adminRepository: IAdminRepository = new AdminRepository();

const adminService: IAdminUseCase = new AdminUseCaseImpl(adminRepository);
const authController = new AuthController(userService,adminService);

router.post('/register', authController.register.bind(authController));
router.post('/verify_otp', authController.verifyOtp.bind(authController));
router.get(
  '/user',
  userAuthMiddleware.authenticate,
  authController.getUser.bind(authController),
);
router.post(
  '/login',
  loginRateLimiter,
  authController.login.bind(authController),
);
router.post('/request_otp', authController.requestOtp.bind(authController));
router.post('/verify_otpf', authController.verify_Otp.bind(authController));
router.post('/resend_otp', authController.resendOtp.bind(authController));
router.post(
  '/reset_password',
  authController.resetPassword.bind(authController),
);
router.post('/google', authController.googleAuth.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;
