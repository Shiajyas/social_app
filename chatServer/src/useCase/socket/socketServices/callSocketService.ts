import { Socket } from 'socket.io';
import { ICallSocketService } from './Interface/ICallSocketService';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { ICallHistoryRepository } from '../../../data/interfaces/ICallHistoryRepository';

export class CallSocketService implements ICallSocketService {
  private _OnlineUserRepository: ISUserRepository;
  private _MainUserReopository: IUserRepository;
  private _CallHistoryRepository: ICallHistoryRepository;

  constructor(
    onlineUserRepository: ISUserRepository,
    mainUserReopository: IUserRepository,
    CallHistoryRepository: ICallHistoryRepository,
  ) {
    this._OnlineUserRepository = onlineUserRepository;
    this._MainUserReopository = mainUserReopository;
    this._CallHistoryRepository = CallHistoryRepository;
  }

  async handleOffer(socket: Socket, data: any) {
    const sender = await this._MainUserReopository.findById(data.from);
    const recipient = await this._OnlineUserRepository.findById(data.to);

    if (recipient && sender) {
      const caller = {
        _id: sender._id,
        username: sender.username,
        avatar: sender.avatar || null,
      };

      console.log("recipient", recipient, "recipient");

      socket.to(recipient?.chatSocketId ?? "").emit('incoming:call', {
        from: data.from,
        offer: data.offer,
        type: data.type,
        caller,
      });

      console.log(
        `📞 Incoming call from ${data.from} to ${data.to} (type: ${data.type})`,
      );
    } else {
      console.warn(`⚠️ Cannot send offer — user ${data.to} not online.`);
    }
  }

  async handleAnswer(socket: Socket, data: any) {
    const recipient = await this._OnlineUserRepository.findById(data.to);
    // console.log(data, 'data answer>>>>>>>>>>>>>');
    // console.log(recipient, 'recipient answer>>>>>>>>>>>>>');

    if (recipient) {
      socket.to(recipient?.chatSocketId ?? "").emit('call:accepted', data);
    } else {
      console.warn(`⚠️ Cannot send answer — user ${data.to} not online.`);
    }
  }

  async handleIceCandidate(socket: Socket, data: any) {
    const recipient = await this._OnlineUserRepository.findById(data.to);

    if (recipient) {
      socket.to(recipient?.chatSocketId ?? "").emit('ice-candidated', data);
    } else {
      console.warn(`⚠️ Cannot send ICE candidate — user ${data.to} not online.`);
    }
  }

  async handleCallEnd(socket: Socket, data: any) {
    const recipient = await this._OnlineUserRepository.findById(data.to);

    if (recipient) {
      socket.to(recipient.chatSocketId ?? '').emit('call:ended', data);
    }

    // Save call history
    try {
      const { from, to, type, startedAt, endedAt, chatId } = data;

      const duration = Math.floor(
        (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
      );

      if (chatId) {
        console.log(data, 'data end>>>>>>>>>>>>>');
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
      console.log(
        `🎤 Toggling mic for user ${data.to}: ${data.micOn ? 'ON' : 'OFF'}`,
      );
      socket
        .to(recipient?.chatSocketId ?? '')
        .emit('call:toggle-mic', { micOn: data.micOn });
    } else {
      console.warn(`⚠️ Cannot toggle mic — user ${data.to} not online.`);
    }
  }

  async handleVideoToggle(
    socket: Socket,
    data: { to: string; videoOn: boolean },
  ) {
    const recipient = await this._OnlineUserRepository.findById(data.to);

    if (recipient) {
      console.log(
        `🎥 Toggling video for user ${data.to}: ${data.videoOn ? 'ON' : 'OFF'}`,
      );
      socket
        .to(recipient.chatSocketId ?? '')
        .emit('call:toggle-video', { videoOn: data.videoOn });
    } else {
      console.warn(`⚠️ Cannot toggle video — user ${data.to} not online.`);
    }
  }
}
