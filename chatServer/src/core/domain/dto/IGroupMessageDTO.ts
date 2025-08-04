export interface MessageDTO {
  _id: string;
  groupId: string;
  senderId: string;
  content: string;
  timestamp: string;
  replyTo?: {
    _id: string;
    content: string;
    senderId: string;
  };
  sender?: {
    _id: string;
    username: string;
    avatar: string | null;
  };
}
