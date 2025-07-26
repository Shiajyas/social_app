import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import { IAdminOverviewService } from '../../interfaces/IAdminOverviewService';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
import { IReportRepository } from '../../../data/interfaces/IReportRepository';
import { INotificationService } from '../../interfaces/InotificationService';
import { SYSTEM_ADMIN_ID } from '../../../infrastructure/config/system';
import { IPostRepository } from '../../../data/interfaces/IPostRepository';

export class AdminSocketService {
  private _Io: Server;
  private _AdminOverviewService: IAdminOverviewService;
  private _SessionUserRepo: ISUserRepository;
  private _ReportRepository: IReportRepository;
  private _NotificationService?: INotificationService;
  private _PostRepository : IPostRepository

  constructor(
    io: Server,
    adminOverviewService: IAdminOverviewService,
    sessionUserRepo: ISUserRepository,
    reportRepository: IReportRepository,
    notificationService: INotificationService,
    postRepository: IPostRepository
  ) {
    this._Io = io;
    this._AdminOverviewService = adminOverviewService;
    this._SessionUserRepo = sessionUserRepo;
    this._ReportRepository = reportRepository;
    this._NotificationService = notificationService;
    this._PostRepository = postRepository
  }

  registerAdmin(socketId: string) {
    console.log(`Admin connected: ${socketId}`);
    const count = this._SessionUserRepo.getActiveUserCount()
    this._Io.to('admin').emit('admin:updateOnlineCount', count);
  }

  unregisterAdmin(socketId: string) {
    console.log(`Admin disconnected: ${socketId}`);
  }

async getOverviewData() {
  const defaultRange: '7d' | '1m' | '1y' = '7d';
  const defaultLikesRange = { min: 0, max: Infinity };

  return await this._AdminOverviewService.getOverview(defaultRange, defaultLikesRange);
}



  async pushOverviewUpdate() {
    const data = await this.getOverviewData();
    this._Io.to('admin').emit('admin:updateOverview', data);
  }

 async sendOnlineUserCountTo(socket: Socket) {
  const count = await this._SessionUserRepo.getActiveUserCount()

  if(typeof count === 'number'){
    socket.emit('admin:updateOnlineCount', count);
  }
  console.log('Sending online user count to admin:', count);

  }

  async broadcastOnlineUserCountToAdmins() {
    const count = await this._SessionUserRepo.getActiveUserCount()
    console.log('Broadcasting online user count to admins:', count);
      if(typeof count === 'number'){
      this._Io.to('admin').emit('admin:updateOnlineCount', count);
  }

  }

  async reportPost(postId: string, userId: string, reason: string) {
    try {
      await this._ReportRepository.create({
        reporter: new Types.ObjectId(userId),
        postId: new Types.ObjectId(postId),
        reason,
      });

      const enrichedReport =
        await this._ReportRepository.fetchSingleReportedPost(postId, userId);
      if (enrichedReport) {
        this._Io.to('admin').emit('admin:newReport', enrichedReport);
        console.log(' Emitted admin:newReport');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  }

  async dismissReport(reportId: string) {
    try {
      await this._ReportRepository.deleteById(reportId);
      console.log(`🗑️ Report ${reportId} dismissed`);
    } catch (error) {
      console.error(' Error dismissing report:', error);
    }
  }

  async deletePost(postId: string) {
    try {
      const post: any = await this._PostRepository.getPost(postId);
      if (!post) {
        console.warn(` Post ${postId} not found`);
        return;
      }

      const ownerId = post?.userId?._id?.toString();
      console.log(' Deleting post:', postId, 'Owner:', ownerId);

      await this._ReportRepository.blockPostById(postId);
      this._Io.to('admin').emit('admin:postDeleted', { postId });
      console.log(`Post ${postId} deleted and admins notified`);

      if (this._NotificationService && ownerId) {
        console.log('Sending notification to user:', ownerId);
        await this._NotificationService.sendNotification(
          SYSTEM_ADMIN_ID.toString(),
          [ownerId],
          'post',
          'Your post was removed by an admin due to multiple reports.',
          postId,
          'Admin',
        );
        console.log(`📩 User ${ownerId} notified`);
      } else if (!this._NotificationService) {
        console.warn('⚠️ Notification service not available');
      } else {
        console.warn('⚠️ Owner ID is undefined; notification not sent');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }
}
