import { Socket, Server } from 'socket.io';
import { ICallSocketService } from './Interface/ICallSocketService';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { ICallHistoryRepository } from '../../../data/interfaces/ICallHistoryRepository';

export class CallSocketService implements ICallSocketService {
  private _OnlineUserRepository: ISUserRepository;
  private _MainUserRepository: IUserRepository;
  private _CallHistoryRepository: ICallHistoryRepository;
  private _io: Server;

  constructor(
    onlineUserRepository: ISUserRepository,
    mainUserRepository: IUserRepository,
    callHistoryRepository: ICallHistoryRepository,
    io: Server,
  ) {
    this._OnlineUserRepository = onlineUserRepository;
    this._MainUserRepository = mainUserRepository;
    this._CallHistoryRepository = callHistoryRepository;
    this._io = io;
  }

  private async emitToUserSockets(userId: string, event: string, data: any) {
    const socketIds = await this._OnlineUserRepository.getSocketIds(userId);
    if (socketIds.length === 0) {
      console.warn(`⚠️ No sockets found for user ${userId}`);
      return;
    }
    for (const sid of socketIds) {
      this._io.to(sid).emit(event, data);
    }
  }

  async handleOffer(socket: Socket, data: {
  from: string,       
  to: string,       
  offer: string,
  type : string,       
}) {
    const sender = await this._MainUserRepository.findById(data.from);
    const recipient = await this._OnlineUserRepository.findById(data.to);

    if (recipient && sender) {
      const caller = {
        _id: sender._id,
        username: sender.username,
        avatar: sender.avatar || null,
      };

      console.log(`📞 Incoming call from ${data.from} to ${data.to} (type: ${data.type})`);
      await this.emitToUserSockets(data.to, 'incoming:call', {
        from: data.from,
        offer: data.offer,
        type: data.type,
        caller,
      });
    } else {
      console.warn(`⚠️ Cannot send offer — user ${data.to} not online.`);
    }
  }

  async handleAnswer(socket: Socket, data: {
    from: string,
    to: string,
    answer: string,
    type: string,
  }) {
    const recipient = await this._OnlineUserRepository.findById(data.to);
    if (recipient) {
      await this.emitToUserSockets(data.to, 'call:accepted', data);
    } else {
      console.warn(`⚠️ Cannot send answer — user ${data.to} not online.`);
    }
  }

  async handleIceCandidate(socket: Socket, data: {
    from: string,
    to: string,
    candidate: string,
  }) {
    const recipient = await this._OnlineUserRepository.findById(data.to);
    if (recipient) {
      await this.emitToUserSockets(data.to, 'ice-candidated', data);
    } else {
      console.warn(`⚠️ Cannot send ICE candidate — user ${data.to} not online.`);
    }
  }

  async handleCallEnd(socket: Socket, data:{
    from: string,
    to: string,
    type: "voice" | "video",
    startedAt: string,
    endedAt: string,
    chatId: string,
  }) {
    const recipient = await this._OnlineUserRepository.findById(data.to);
    if (recipient) {
      await this.emitToUserSockets(data.to, 'call:ended', data);
    }

    try {
      const { from, to, type, startedAt, endedAt, chatId } = data;
      const duration = Math.floor(
        (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
      );

      if (chatId) {
        console.log('📞 Call ended — saving history', data);
        await this._CallHistoryRepository.saveCallHistory({
          callerId: from,
          receiverId: to,
          callType: type,
          startedAt: new Date(startedAt),
          endedAt: new Date(endedAt),
          duration,
          chatId,
        });
      }
    } catch (error) {
      console.error('❌ Failed to save call history:', error);
    }
  }

  async handleMicToggle(socket: Socket, data: { to: string; micOn: boolean }) {
    const recipient = await this._OnlineUserRepository.findById(data.to);
    if (recipient) {
      console.log(`🎤 Toggling mic for user ${data.to}: ${data.micOn ? 'ON' : 'OFF'}`);
      await this.emitToUserSockets(data.to, 'call:toggle-mic', { micOn: data.micOn });
    } else {
      console.warn(`⚠️ Cannot toggle mic — user ${data.to} not online.`);
    }
  }

  async handleVideoToggle(socket: Socket, data: { to: string; videoOn: boolean }) {
    const recipient = await this._OnlineUserRepository.findById(data.to);
    if (recipient) {
      console.log(`🎥 Toggling video for user ${data.to}: ${data.videoOn ? 'ON' : 'OFF'}`);
      await this.emitToUserSockets(data.to, 'call:toggle-video', { videoOn: data.videoOn });
    } else {
      console.warn(`⚠️ Cannot toggle video — user ${data.to} not online.`);
    }
  }
}
