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
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  const createPeerConnection = () => {
// const pc = new RTCPeerConnection({
//   iceServers: [
//     { urls: 'stun:stun.l.google.com:19302' }, // STUN (fallback)
//     {
//       urls: 'turn:15.207.66.184:3478',
//       username: 'myuser', // must match your Coturn config
//       credential: 'mypassword', // must match your Coturn config
//     },
//   ],
// });

const pc = new RTCPeerConnection({
  iceTransportPolicy: 'all', // force TURN usage
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: ['turn:15.207.66.184:3478?transport=udp'], 
      username: 'myuser',
      credential: 'mypassword',
    },
  ],
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
        remoteAudioRef.current.play().catch((err) => console.warn('🔇 Could not play remote audio:', err));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && callPartnerId) {
        socket.emit('call:ice-candidate', {
          from: userId,
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

      const constraints = type === 'video' ? { audio: true, video: true } : { audio: true, video: false };
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
        offer: pc.localDescription, // ✅ Use actual local description
        type,
      });

      onCallStart();
    } catch (err) {
      console.error('❌ Failed to start call:', err);
      onCallEnd();
    }
  }, [chatId, userId, onCallStart, onCallEnd]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !offer) return;

    try {
      callEndedRef.current = false;
      setCallPartnerId(incomingCall.caller._id);
      callStartTimeRef.current = new Date();

      const constraints = incomingCall.callType === 'video' ? { audio: true, video: true } : { audio: true, video: false };
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
      remoteDescSetRef.current = true;

      for (const candidate of pendingCandidates.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('❄ Skipped ICE candidate:', err);
        }
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        from: userId,
        to: incomingCall.caller._id,
        answer: pc.localDescription,
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

  console.log('🔚 [endCall] Triggered');
  console.log('🕒 Started at:', startedAt.toISOString());
  console.log('🕒 Ended at:', endedAt.toISOString());
  console.log('👤 Call partner ID:', callPartnerId);
  console.log('📞 Incoming call object:', incomingCall);

  // Determine recipient for call:end event
  const targetId = callPartnerId || incomingCall?.caller?._id;

  if (targetId) {
    const finalCallType = callType || incomingCall?.callType;
    console.log('📡 Emitting call:end to:', targetId);

    socket.emit('call:end', {
      to: targetId,
      from: userId,
      type: finalCallType,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      chatId: activeChatId ?? null,
    });
  } else {
    console.warn('⚠️ No valid partner ID to emit call:end');
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    setPeerConnection(null);
  }

  // Stop and clean up local/remote media streams
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => track.stop());
    setRemoteStream(null);
  }

  // Clear media refs
  if (localVideoRef.current) localVideoRef.current.srcObject = null;
  if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

  // Reset all state flags
  setIsMicOn(true);
  setIsVideoOn(true);
  setIsRemoteMicOn(true);
  setIsRemoteVideoOn(true);
  setCallPartnerId(null);
  setCallActive(false);

  // Reset stores and internal refs
  clearIncomingCall();
  remoteDescSetRef.current = false;
  pendingCandidates.current = [];
  callStartTimeRef.current = null;

  // Call external handler
  onCallEnd();

  console.log('✅ [endCall] Cleanup complete');
}, [
  peerConnection,
  localStream,
  remoteStream,
  userId,
  callType,
  activeChatId,
  callPartnerId,
  incomingCall,
  clearIncomingCall,
  onCallEnd,
]);

  const toggleMic = () => {
    if (!localStream) return;
    const newState = !isMicOn;
    localStream.getAudioTracks().forEach((t) => (t.enabled = newState));
    socket.emit('call:toggle-mic', { to: callPartnerId, micOn: newState });
    setIsMicOn(newState);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const newState = !isVideoOn;
    localStream.getVideoTracks().forEach((t) => (t.enabled = newState));
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
        remoteDescSetRef.current = true;

        for (const candidate of pendingCandidates.current) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.current = [];
        setCallActive(true);
      } catch (err) {
        console.error('❌ Error setting remote description:', err);
      }
    };

    const handleRemoteCandidate = ({ candidate }: any) => {
      if (!peerConnection) return;
      if (!remoteDescSetRef.current) {
        pendingCandidates.current.push(candidate);
      } else {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.warn('❄ Error adding ICE candidate:', err));
      }
    };

    const handleCallEnd = () => endCall();

    const handlePartnerMicToggle = ({ micOn }: { micOn: boolean }) => setIsRemoteMicOn(micOn);

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
