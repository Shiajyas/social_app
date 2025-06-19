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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [callPartnerId, setCallPartnerId] = useState<string | null>(null);

  const [isRemoteMicOn, setIsRemoteMicOn] = useState(true);
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(true);

  const { incomingCall, clearIncomingCall, setIncomingCall } = useIncomingCallStore();
  const callEndedRef = useRef(false);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ontrack = (event) => {
      const inboundStream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => inboundStream.addTrack(track));
      setRemoteStream(inboundStream);

      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = inboundStream;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = inboundStream;
        remoteAudioRef.current
          .play()
          .catch((err) => console.warn('🔇 Could not auto-play remote audio:', err));
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

  const startCall = useCallback(
    async (type: 'voice' | 'video') => {
      try {
        if (!chatId) throw new Error('chatId is undefined');
        callEndedRef.current = false;
        setCallPartnerId(chatId);

        const constraints = type === 'video'
          ? { audio: true, video: true }
          : { audio: true, video: false };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        setIsMicOn(true);
        setIsVideoOn(type === 'video');

        if (type === 'video' && localVideoRef.current) {
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
        console.error('❌ Failed to start call:', err);
        onCallEnd();
      }
    },
    [chatId, userId, onCallStart, onCallEnd]
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !offer) return;

    try {
      callEndedRef.current = false;
      setCallPartnerId(incomingCall.caller._id);
      callStartTimeRef.current = new Date();

      const constraints = incomingCall.callType === 'video'
        ? { audio: true, video: true }
        : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsMicOn(true);
      setIsVideoOn(incomingCall.callType === 'video');

      if (incomingCall.callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
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
      console.error('❌ Error during call acceptance:', err);
      endCall();
    }
  }, [incomingCall, offer, clearIncomingCall, onCallStart, setCallActive]);

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

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    setIsMicOn(true);
    setIsVideoOn(true);
    setOffer(null);
    setCallPartnerId(null);
    setIsRemoteMicOn(true);
    setIsRemoteVideoOn(true);
    setCallActive(false);
    clearIncomingCall();
    onCallEnd();
  }, [peerConnection, localStream, remoteStream, userId, callType, activeChatId]);

  const toggleMic = () => {
    if (!localStream) return;
    const newState = !isMicOn;
    localStream.getAudioTracks().forEach((track) => (track.enabled = newState));
    socket.emit('call:toggle-mic', { to: callPartnerId, micOn: newState });
    setIsMicOn(newState);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const newState = !isVideoOn;
    localStream.getVideoTracks().forEach((track) => (track.enabled = newState));
    socket.emit('call:toggle-video', { to: callPartnerId, videoOn: newState });
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
        console.error('Error setting remote description:', err);
      }
    };

    const handleRemoteCandidate = ({ candidate }: any) => {
      if (!peerConnection) return;
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleCallEnd = () => endCall();

    const handlePartnerMicToggle = ({ micOn }: { micOn: boolean }) =>
      setIsRemoteMicOn(micOn);

    const handlePartnerVideoToggle = ({ videoOn }: { videoOn: boolean }) => {
      setIsRemoteVideoOn(videoOn);
      const tracks = remoteStream?.getVideoTracks();
      if (tracks) tracks.forEach((t) => (t.enabled = videoOn));
    };

    socket.on('incoming:call', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('ice-candidated', handleRemoteCandidate);
    socket.on('call:ended', handleCallEnd);
    socket.on('call:toggle-mic', handlePartnerMicToggle);
    socket.on('call:toggle-video', handlePartnerVideoToggle);

    return () => {
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('ice-candidated', handleRemoteCandidate);
      socket.off('call:ended', handleCallEnd);
      socket.off('call:toggle-mic', handlePartnerMicToggle);
      socket.off('call:toggle-video', handlePartnerVideoToggle);
    };
  }, [peerConnection, remoteStream]);

  return {
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
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
