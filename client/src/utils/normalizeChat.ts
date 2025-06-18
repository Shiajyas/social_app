export interface NormalizedChat {
  _id: string;
  users: { _id: string; username: string; avatar?: string }[];
  isGroupChat: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: string;
  lastMessage?: {
    _id: string;
    text: string;
    senderId: string;
    createdAt: string;
  };
}

export const normalizeChat = (chat: any): NormalizedChat => {


  return chat;
};
