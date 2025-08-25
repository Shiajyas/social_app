import { IGroupMessageRepository as IMessageRepository } from '../interfaces/IGroupMessageRepository';
import { MessageDTO } from '../../core/domain/dto/IGroupMessageDTO';
import { IGroupMessage } from '../../core/domain/interfaces/IGroupMessage';
import MessageModel from '../../core/domain/models/GroupMessage';
import GroupModel from '../../core/domain/models/Group'; // ✅ import Group model
import { IGroupMessageRepository } from '../interfaces/IGroupMessageRepository';

export class GroupMessageRepository implements IMessageRepository {
  
  async getRecentMessages(communityId: string, limit: number): Promise<MessageDTO[]> {
    console.log(communityId, 'communityId');
    const messages = await MessageModel.find({ groupId: communityId })
      .populate("senderId", "username fullname avatar")
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('replyTo')
      .lean();

    return this.toDTOs(messages.reverse());
  }

  async getMessagesBefore(communityId: string, before: string, limit: number): Promise<MessageDTO[]> {
    const messages = await MessageModel.find({
      groupId: communityId,
      timestamp: { $lt: new Date(before) },
    })
      .populate("senderId", "username fullname avatar")
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('replyTo')
      .lean();

    return this.toDTOs(messages.reverse());
  }

  async createMessage({
    groupId,
    senderId,
    content,
    replyToMessageId,
  }: {
    groupId: string;
    senderId: string;
    content: string;
    replyToMessageId?: string;
  }): Promise<MessageDTO> {
    // 1. Create and save new message
    const message = new MessageModel({
      groupId,
      senderId,
      content,
      replyTo: replyToMessageId || undefined,
    });

    await message.save();

    // 2. Update Group with latest message reference
    await GroupModel.findByIdAndUpdate(groupId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    // 3. Fetch full populated message
    const fullMessage = await MessageModel.findById(message._id)
      .populate("senderId", "username fullname avatar")
      .populate("replyTo")
      .lean();

    return this.toDTO(fullMessage!);
  }

  async getMessageById(messageId: string): Promise<MessageDTO | null> {
    try {
      console.log(messageId, 'messageId');
      const message = await MessageModel.findById(messageId)
        .populate("senderId", "username fullname avatar")
        .populate("replyTo")
        .lean();
      return message ? this.toDTO(message) : null;
    } catch (error) {
      console.error('Error fetching message by ID:', error);
      return null;
    }
  }

  // 🔹 Convert a single message to DTO
  private toDTO(msg: any): MessageDTO {
    return {
      _id: msg._id.toString(),
      groupId: msg.groupId.toString(),
      senderId: typeof msg.senderId === 'object'
        ? msg.senderId._id.toString()
        : msg.senderId.toString(),
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      replyTo: msg.replyTo
        ? {
            _id: msg.replyTo._id.toString(),
            content: msg.replyTo.content,
            senderId: msg.replyTo.senderId.toString(),
          }
        : undefined,
      sender: msg.senderId && typeof msg.senderId === 'object'
        ? {
            _id: msg.senderId._id.toString(),
            username: msg.senderId.username,
            avatar: msg.senderId.avatar ?? null,
          }
        : undefined,
    };
  }

  // 🔹 Convert multiple messages
  private toDTOs(msgs: any[]): MessageDTO[] {
    return msgs.map((msg) => this.toDTO(msg));
  }
}
