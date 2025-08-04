

// import MessageModel, { IMessage } from '../models/Message';
import { IGroupMessageRepository as IMessageRepository } from '../interfaces/IGroupMessageRepository';
import { MessageDTO } from '../../core/domain/dto/IGroupMessageDTO';
import { IGroupMessage } from '../../core/domain/interfaces/IGroupMessage';
import MessageModel from '../../core/domain/models/GroupMessage';
import Group from '../../core/domain/models/Group';
export class GroupMessageRepository implements IMessageRepository {
  async getRecentMessages(communityId: string, limit: number): Promise<MessageDTO[]> {
    const messages = await MessageModel.find({ communityId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('replyTo')
      .lean();

    return this.toDTOs(messages.reverse());
  }

  async getMessagesBefore(communityId: string, before: string, limit: number): Promise<MessageDTO[]> {
    const messages = await MessageModel.find({
      communityId,
      timestamp: { $lt: new Date(before) },
    })
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
    const message = new MessageModel({
      groupId,
      senderId,
      content,
      replyTo: replyToMessageId || undefined,
    });

 await Group.findByIdAndUpdate(groupId, {
  $inc: { messageCount: 1 }
});

    await message.save();
    const fullMessage = await MessageModel.findById(message._id).populate('replyTo').lean();

    return this.toDTO(fullMessage!);
  }

  getMessageById(communityId: string, messageId: string): Promise<MessageDTO | null> {
    return MessageModel.findById(messageId)
      .populate('replyTo')
      .lean()
      .then((message) => (message ? this.toDTO(message) : null));
  }


private toDTO(msg: any): MessageDTO {
  return {
    _id: msg._id.toString(),
    groupId: msg.groupId.toString(),
    senderId: typeof msg.senderId === 'object' ? msg.senderId._id.toString() : msg.senderId.toString(),
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

private toDTOs(msgs: any[]): MessageDTO[] {
  return msgs.map((msg) => this.toDTO(msg));
}

  // async receiveMessage(data: IGroupMessage): Promise<MessageDTO> {
  //   const message = new MessageModel(data);
  //   await message.save();
  //   return this.toDTO(message);
  // }
}
