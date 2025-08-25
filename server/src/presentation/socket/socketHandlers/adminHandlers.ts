import { Socket } from 'socket.io';
import { ISocketAdminService } from '../../../useCase/socket/socketServices/Interface/ISocketAdminService';

export class AdminSocketHandler {
  private _socket: Socket;
  private _adminService: ISocketAdminService;

  constructor(socket: Socket, adminService: ISocketAdminService) {
    this._socket = socket;
    this._adminService = adminService;

    this.registerHandlers();
  }

  private registerHandlers() {
    this._socket.on('admin:join', this.ADMIN_JOIN);
    this._socket.on('admin:refreshOverview', this.ADMIN_REFRESH_OVERVIEW);
    this._socket.on('report:post', this.REPORT_POST);
    this._socket.on('admin:dismissReport', this.ADMIN_DISMISS_REPORT);
    this._socket.on('admin:blockPost', this.ADMIN_BLOCK_POST);
    this._socket.on('disconnect', this.DISCONNECT);
  }

  private ADMIN_JOIN = (adminId: string) => {
    this._socket.join('admin');
    console.log(`👨‍💻 Admin connected: ${adminId}`);
    this._adminService.registerAdmin(adminId, this._socket.id);
    this._adminService.sendOnlineUserCountTo(this._socket);

    this._adminService.getOverviewData().then((data) => {
      this._socket.emit('admin:updateOverview', data);
    });
  };

  private ADMIN_REFRESH_OVERVIEW = async () => {
    const data = await this._adminService.getOverviewData();
    this._socket.emit('admin:updateOverview', data);
  };

  private REPORT_POST = async (
    data: { postId: string; userId: string; reason: string },
    callback: (response: { success: boolean; message?: string }) => void,
  ) => {
    try {
      await this._adminService.reportPost(data.postId, data.userId, data.reason);
      console.log(
        `📣 Report received for post ${data.postId} by user ${data.userId} reason: ${data.reason}`,
      );
      callback({ success: true, message: 'Report submitted.' });
    } catch (error) {
      console.error('❌ Error reporting post:', error);
      callback({ success: false, message: 'Failed to submit report.' });
    }
  };

  private ADMIN_DISMISS_REPORT = async (
    reportId: string,
    callback: (response: { success: boolean; message?: string }) => void,
  ) => {
    try {
      await this._adminService.dismissReport(reportId);
      console.log(`🗑️ Report ${reportId} dismissed by admin ${this._socket.id}`);
      callback({ success: true });
    } catch (error) {
      console.error('❌ Failed to dismiss report:', error);
      callback({ success: false, message: 'Failed to dismiss report' });
    }
  };

  private ADMIN_BLOCK_POST = async (
    postId: string,
    callback: (response: { success: boolean; message?: string }) => void,
  ) => {
    try {
      await this._adminService.deletePost(postId);
      console.log(`🚫 Post ${postId} blocked by admin ${this._socket.id}`);
      callback({ success: true });
    } catch (error) {
      console.error('❌ Failed to block post:', error);
      callback({ success: false, message: 'Failed to block post' });
    }
  };

  private DISCONNECT = () => {
    this._adminService.unregisterAdmin(this._socket.id);
  };
}
