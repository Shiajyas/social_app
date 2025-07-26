import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { OtpService } from '../../../infrastructure/services/otpService';
import { IOtpService } from '../../../infrastructure/services/interfaces/IOtpService';
import { UserRepository } from '../../../data/repositories/UserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { AuthService } from '../../../useCase/authOperations';
import { IAuthService } from '../../../useCase/interfaces/IAuthService';

import { AdminUseCaseImpl } from '../../../useCase/adminUseCaseImpl';
import { AdminRepository } from '../../../data/repositories/AdminRepository';
import { AdminController } from '../../controllers/AdminController';

import adminAuthMiddleware from '../../middleware/adminAuthMiddleware';


import { IAdminOverviewService } from '../../../useCase/interfaces/IAdminOverviewService';
import { IAdminOverviewRepository } from '../../../data/interfaces/IAdminOverviewRepository';
import { AdminOverviewRepository } from '../../../data/repositories/AdminOverviewRepository';
import { AdminOverviewService } from '../../../useCase/adminOverviewService';
import { ReportRepository } from '../../../data/repositories/ReportRepository';
import { IReportRepository } from '../../../data/interfaces/IReportRepository';

import { IAdminSubscriptionService } from '../../../useCase/interfaces/IAdminSubscriptionService';
import { AdminSubscriptionController } from '../../controllers/AdminSubscriptionController';
import { AdminSubscriptionService as adminSubscriptionServiceImpl } from '../../../useCase/adminSubscriptionService';

import {AdminOverviewController} from '../../controllers/AdminOverviewController';

const router = Router();

// Dependency instantiation
const userRepository: IUserRepository = new UserRepository();
const otpService: IOtpService = new OtpService();
const userService: IAuthService = new AuthService(userRepository, otpService);

const adminRepository = new AdminRepository();
const adminUseCase = new AdminUseCaseImpl(adminRepository);

const reportRepository: IReportRepository = new ReportRepository();
const adminOverviewRepository: IAdminOverviewRepository = new AdminOverviewRepository();
const adminOverviewService: IAdminOverviewService = new AdminOverviewService(adminOverviewRepository, reportRepository);
const {
  getOverview,
  getMostLikedPosts,
  getReportedPosts,
  getReportedPostsCount,
} = new AdminOverviewController(adminOverviewService);

// Controllers
const authController = new AuthController(userService, adminUseCase);
const adminController = new AdminController(adminUseCase);

const subscriptionService: IAdminSubscriptionService = new adminSubscriptionServiceImpl;
const {
  getAllSubscriptions,
  updateSubscription,
  getSubscriptions
} = new AdminSubscriptionController(subscriptionService);


// Auth routes
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.adminLogout.bind(authController));
router.get('/user', adminAuthMiddleware.authenticate, authController.getUser.bind(authController));

// User management
router.get('/users', adminAuthMiddleware.authenticate, authController.getAllUser.bind(authController));
router.post('/users/:id/block', authController.blockUser.bind(authController));
router.post('/users/:id/unblock', authController.unblockUser.bind(authController));

// Subscription management
router.get('/subscriptions', adminAuthMiddleware.authenticate, getSubscriptions);
router.get('/subscriptions/all', adminAuthMiddleware.authenticate,getAllSubscriptions);
router.patch('/subscriptions/:id', adminAuthMiddleware.authenticate, updateSubscription);

// Admin dashboard overview
router.get('/overview', adminAuthMiddleware.authenticate, getOverview);
router.get('/overview/most-liked', adminAuthMiddleware.authenticate, getMostLikedPosts);
router.get('/reports', adminAuthMiddleware.authenticate, getReportedPosts);
router.get('/reports/count', adminAuthMiddleware.authenticate, getReportedPostsCount);

// Admin management
router.post('/create-admin', adminAuthMiddleware.authenticate, adminController.createAdmin.bind(adminController));
router.get('/get-admins', adminAuthMiddleware.authenticate, adminController.getAllAdmins.bind(adminController));
router.delete('/delete-admin/:id', adminAuthMiddleware.authenticate, adminController.deleteAdmin.bind(adminController));


export default router;
