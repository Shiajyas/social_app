import { useEffect, useRef, useState, useCallback } from 'react';
import { chatSocket as socket } from '@/utils/chatSocket';
import { useIncomingCallStore } from '@/appStore/useIncomingCallStore';

interface UseWebRTCProps {
  userId: string;
  chatId?: string;
  onCallEnd: () => void;
  onCallStart: () => void;
  setCallActive: (active: boolean) => void;
  callType?: 'voice' | 'video';
  activeChatId?: string;
}

export const useWebRTC = ({
  userId,
  chatId,
  onCallEnd,
  onCallStart,
  setCallActive,
  callType,
  activeChatId,
}: UseWebRTCProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);

  const { incomingCall, clearIncomingCall, setIncomingCall } = useIncomingCallStore();
  const callEndedRef = useRef(false);
  const [callPartnerId, setCallPartnerId] = useState<string | null>(null);

  const [isRemoteMicOn, setIsRemoteMicOn] = useState(true);
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(true);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ontrack = (event) => {
      const inboundStream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => inboundStream.addTrack(track));
      setRemoteStream(inboundStream);

      // 🔊 Voice call uses <audio>, Video uses <video>
      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = inboundStream;
      } else if (callType === 'voice' && localAudioRef.current) {
        localAudioRef.current.srcObject = inboundStream;
        localAudioRef.current.play().catch(console.error);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && callPartnerId) {
        socket.emit('call:ice-candidate', {
          to: callPartnerId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  const startCall = useCallback(async (type: 'voice' | 'video') => {
    try {
      if (!chatId) throw new Error('chatId is undefined');
      callEndedRef.current = false;
      setCallPartnerId(chatId);

      const constraints = type === 'video' ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsMicOn(true);
      setIsVideoOn(type === 'video');

      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:offer', {
        from: userId,
        to: chatId,
        offer,
        type,
      });

      onCallStart();
    } catch (err) {
      console.error('❌ Error starting call:', err);
      onCallEnd();
    }
  }, [userId, chatId, onCallStart, onCallEnd]);

  const endCall = useCallback(() => {
    callEndedRef.current = true;

    const endedAt = new Date();
    const startedAt = callStartTimeRef.current ?? endedAt;

    if (callPartnerId) {
      socket.emit('call:end', {
        to: callPartnerId,
        from: userId,
        type: callType,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        chatId: activeChatId ?? null,
      });
    }

    peerConnection?.close();
    setPeerConnection(null);

    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());

    setLocalStream(null);
    setRemoteStream(null);
    setOffer(null);
    clearIncomingCall();
    onCallEnd();
    setCallActive(false);
    setCallPartnerId(null);
    setIsMicOn(true);
    setIsVideoOn(true);
    setIsRemoteMicOn(true);
    setIsRemoteVideoOn(true);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localAudioRef.current) localAudioRef.current.srcObject = null;
  }, [peerConnection, localStream, remoteStream, callPartnerId, userId, callType, activeChatId]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !offer) return;

    try {
      callEndedRef.current = false;
      setCallPartnerId(incomingCall.caller._id);
      callStartTimeRef.current = new Date();

      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video' ? true : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsMicOn(true);
      setIsVideoOn(incomingCall.callType === 'video');

      if (localVideoRef.current && incomingCall.callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      socket.on('call:ice-candidate', ({ candidate }: any) => {
        if (pc && candidate) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        to: incomingCall.caller._id,
        answer,
      });

      setCallActive(true);
      onCallStart();
      clearIncomingCall();
      setOffer(null);
    } catch (err) {
      console.error('❌ Error accepting call:', err);
      onCallEnd();
    }
  }, [incomingCall, offer, onCallStart, onCallEnd]);

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !isMicOn;
    });
    const newState = !isMicOn;
    if (callPartnerId) {
      socket.emit('call:toggle-mic', {
        to: callPartnerId,
        micOn: newState,
      });
    }
    setIsMicOn(newState);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOn;
    });
    const newState = !isVideoOn;
    if (callPartnerId) {
      socket.emit('call:toggle-video', {
        to: callPartnerId,
        videoOn: newState,
      });
    }
    setIsVideoOn(newState);
  };

  useEffect(() => {
    const handleIncomingCall = ({ from, offer, type, caller }: any) => {
      setIncomingCall({ caller, chatId: from, callType: type });
      setCallPartnerId(from);
      setOffer(offer);
    };

    const handleCallAccepted = async ({ answer }: any) => {
      if (!peerConnection) return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        setCallActive(true);
      } catch (err) {
        console.error('❌ Error setting remote description:', err);
      }
    };

    const handleRemoteCandidate = ({ candidate }: any) => {
      if (peerConnection && candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCallEnd = () => {
      endCall();
    };

    const handlePartnerMicToggle = ({ micOn }: { micOn: boolean }) => {
      setIsRemoteMicOn(micOn);
    };

    const handlePartnerVideoToggle = ({ videoOn }: { videoOn: boolean }) => {
      setIsRemoteVideoOn(videoOn);
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const tracks = (remoteVideoRef.current.srcObject as MediaStream).getVideoTracks();
        tracks.forEach((track) => (track.enabled = videoOn));
      }
    };

    socket.on('incoming:call', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:ice-candidate', handleRemoteCandidate);
    socket.on('call:ended', handleCallEnd);
    socket.on('call:toggle-mic', handlePartnerMicToggle);
    socket.on('call:toggle-video', handlePartnerVideoToggle);

    return () => {
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:ice-candidate', handleRemoteCandidate);
      socket.off('call:ended', handleCallEnd);
      socket.off('call:toggle-mic', handlePartnerMicToggle);
      socket.off('call:toggle-video', handlePartnerVideoToggle);
    };
  }, [peerConnection, endCall, setCallActive]);

  return {
    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    localStream,
    remoteStream,
    isMicOn,
    isVideoOn,
    isRemoteMicOn,
    isRemoteVideoOn,
    toggleMic,
    toggleVideo,
    startCall,
    endCall,
    acceptCall,
    incomingCall,
  };
};
