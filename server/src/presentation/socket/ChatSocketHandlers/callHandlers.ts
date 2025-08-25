import { Socket } from 'socket.io';
import { ICallSocketService } from '../../../useCase/ChatSocket/ChatSocketServices/Interface/ICallSocketService';

export class CallHandlers {
  private _Socket: Socket;
  private _CallSocketService: ICallSocketService;

  constructor(socket: Socket, callSocketService: ICallSocketService) {
    this._Socket = socket;
    this._CallSocketService = callSocketService;

    this.RegisterHandlers();
  }

  private RegisterHandlers() {
    this._Socket.on('call:offer', this.HANDLE_OFFER);
    this._Socket.on('call:answer', this.HANDLE_ANSWER);
    this._Socket.on('call:ice-candidate', this.HANDLE_ICE_CANDIDATE);
    this._Socket.on('call:end', this.HANDLE_CALL_END);
    this._Socket.on('call:toggle-mic', this.HANDLE_MIC_TOGGLE);
    this._Socket.on('call:toggle-video', this.HANDLE_VIDEO_TOGGLE);
  }

  private HANDLE_OFFER = async (data: {from: string, to: string, offer: string, type: "voice" | "video"}) => {
    try {
      console.log(`📞 Offer sent from ${data.from} to ${data.to}`);
      await this._CallSocketService.handleOffer(this._Socket, data);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  private HANDLE_ANSWER = async (data: {from: string, to: string, answer: string, type: "voice" | "video"}) => {
    try {
      console.log(`✅ Answer sent from ${data.from} to ${data.to}`);
      await this._CallSocketService.handleAnswer(this._Socket, data);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  private HANDLE_ICE_CANDIDATE = async (data: {from: string, to: string, candidate: string}) => {
    try {
      console.log(`❄️ ICE candidate from ${data.from} to ${data.to}`);
      await this._CallSocketService.handleIceCandidate(this._Socket, data);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  private HANDLE_CALL_END = async (data: {from: string, to: string, type: "voice" | "video", startedAt: string, endedAt: string, chatId: string}) => {
    try {
      console.log(`🔚 Call ended by ${data.to}`);
      await this._CallSocketService.handleCallEnd(this._Socket, data);
    } catch (error) {
      console.error('Error handling call end:', error);
    }
  };

  private HANDLE_MIC_TOGGLE = async (data: {to: string, micOn: boolean}) => {
    try {
      console.log(`🎙️ Mic toggle request from ${data.to}`);
      await this._CallSocketService.handleMicToggle(this._Socket, data);
    } catch (error) {
      console.error('Error handling mic toggle:', error);
    }
  };

  private HANDLE_VIDEO_TOGGLE = async (data:  {to: string, videoOn: boolean}) => {
    try {
      console.log(`🎥 Video toggle request from ${data.to}`);
      await this._CallSocketService.handleVideoToggle(this._Socket, data);
    } catch (error) {
      console.error('Error handling video toggle:', error);
    }
  };
}
