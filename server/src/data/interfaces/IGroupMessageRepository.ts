import { MessageDTO } from "../../core/domain/dto/IGroupMessageDTO";

export interface IGroupMessageRepository {
  getRecentMessages(communityId: string, limit: number): Promise<MessageDTO[]>;
  getMessagesBefore(communityId: string, before: string, limit: number): Promise<MessageDTO[]>;
  getMessageById(communityId: string): Promise<MessageDTO | null>;
  createMessage(data: {
    groupId: string;
    senderId: string;
    content: string;
    mediaUrls?: string[];
    replyToMessageId?: string;
  }): Promise<MessageDTO>;

  // receiveMessage(data: {
  //   groupId: string;
  //   senderId: string;
  //   content: string;
  //   mediaUrls?: string[];
  //   replyToMessageId?: string;
  // }): Promise<MessageDTO>;
}
