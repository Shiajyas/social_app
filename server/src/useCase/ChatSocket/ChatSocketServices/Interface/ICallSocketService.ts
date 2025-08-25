import { Socket, Server } from "socket.io";

export interface ICallSocketService {
  handleOffer(
    socket: Socket,
    data: {
      from: string;
      to: string;
      offer: string;
      type: "voice" | "video";
    }
  ): Promise<void>;

  handleAnswer(
    socket: Socket,
    data: {
      from: string;
      to: string;
      answer: string;
      type: "voice" | "video";
    }
  ): Promise<void>;

  handleIceCandidate(
    socket: Socket,
    data: {
      from: string;
      to: string;
      candidate: any; // RTCIceCandidateInit, but can stay `any` for flexibility
    }
  ): Promise<void>;

  handleCallEnd(
    socket: Socket,
    data: {
      from: string;
      to: string;
      type: "voice" | "video";
      startedAt: string;
      endedAt: string;
      chatId: string;
    }
  ): Promise<void>;

  handleMicToggle(
    socket: Socket,
    data: {
      to: string;
      micOn: boolean;
    }
  ): Promise<void>;

  handleVideoToggle(
    socket: Socket,
    data: {
      to: string;
      videoOn: boolean;
    }
  ): Promise<void>;
}
