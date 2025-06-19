import React, { useEffect, useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, User } from 'lucide-react';
import gsap from 'gsap';

interface CallUIProps {
  callType: 'voice' | 'video';
  onClose: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicOn: boolean;
  isVideoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  isRemoteMicOn: boolean;
  isRemoteVideoOn: boolean;
  otherUser?: { username: string; avatar?: string; isMicMuted?: boolean };
  callActive: boolean;
  incomingCall: boolean;
  onCallAccepted: () => void;
  remoteAudioRef: React.RefObject<HTMLAudioElement>;
}

const CallUI: React.FC<CallUIProps> = ({
  callType,
  onClose,
  localStream,
  remoteStream,
  isMicOn,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  isRemoteMicOn,
  isRemoteVideoOn,
  otherUser,
  callActive,
  incomingCall,
  remoteAudioRef,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [audioStarted, setAudioStarted] = useState(false);
  const [ringback, setRingback] = useState<HTMLAudioElement | null>(null);
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);
  const [micLoading, setMicLoading] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  useEffect(() => {
    const setupAudio = () => {
      const newRingback = new Audio('/sounds/outgoing-ring.mp3');
      const newRingtone = new Audio('/sounds/ringtone.mp3');
      newRingback.loop = true;
      newRingtone.loop = true;
      setRingback(newRingback);
      setRingtone(newRingtone);
    };

    const handleAudioStart = () => {
      if (!audioStarted) {
        setAudioStarted(true);
        setupAudio();
      }
    };

    document.body.addEventListener('click', handleAudioStart);
    return () => {
      document.body.removeEventListener('click', handleAudioStart);
      ringback?.pause();
      ringtone?.pause();
    };
  }, [audioStarted]);

  useEffect(() => {
    if (!audioStarted) return;

    if (incomingCall) {
      ringtone?.play().catch((err) => console.warn('Failed to play ringtone', err));
    } else {
      ringtone?.pause();
    }

    if (!callActive && !incomingCall) {
      ringback?.play().catch((err) => console.warn('Failed to play ringback', err));
    } else {
      ringback?.pause();
    }
  }, [incomingCall, callActive, audioStarted, ringback, ringtone]);

  useEffect(() => {
    const localVideo = document.getElementById('local-video') as HTMLVideoElement | null;
    const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement | null;

    if (localVideo && localStream && callType === 'video') {
      localVideo.srcObject = localStream;
    }
    if (remoteVideo && remoteStream && callType === 'video') {
      remoteVideo.srcObject = remoteStream;
    }

    if (remoteAudioRef.current && remoteStream && callType === 'voice') {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, callType, remoteAudioRef]);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const handleMicToggle = async () => {
    setMicLoading(true);
    try {
      await onToggleMic();
    } catch (error) {
      console.error('Error toggling mic:', error);
    } finally {
      setMicLoading(false);
    }
  };

  const handleEndCall = () => {
    setCallEnded(true);
    setTimeout(() => onClose(), 2000);
  };

  useEffect(() => {
    if (callEnded) {
      handleEndCall();
    }
  }, [callEnded]);

  useEffect(() => {
    gsap.fromTo('.call-modal', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3 });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center transition-all">
      <div className="call-modal relative bg-white dark:bg-gray-900 rounded-2xl p-6 w-[90%] sm:w-96 shadow-2xl">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {callType === 'voice' ? 'Voice Call' : 'Video Call'}
          </h2>
        </div>

        {callType === 'video' && (
          <div className="relative w-full h-64 mb-2 rounded-lg overflow-hidden bg-black flex items-center justify-center">
            {!remoteStream && <p className="text-white absolute">Connecting...</p>}
            <video id="remote-video" autoPlay playsInline className="w-full h-full object-cover" />
            <video
              id="local-video"
              autoPlay
              muted
              playsInline
              className="absolute bottom-2 right-2 w-24 h-24 sm:w-28 sm:h-28 border-2 border-white rounded-lg object-cover"
            />
            {!isRemoteVideoOn && (
              <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center text-white text-lg">
                Camera Off
              </div>
            )}
            {!isRemoteMicOn && (
              <div className="absolute bottom-3 left-3 text-white text-xs bg-blue p-1 rounded-full">
                <MicOff className="w-6 h-6" />
              </div>
            )}
          </div>
        )}

        {callType === 'voice' && (
          <div className="w-full h-48 flex items-center justify-center rounded-lg mb-2 bg-gray-100 dark:bg-gray-800">
            <div className="flex flex-col items-center">
              {otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={otherUser.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <User className="text-white w-10 h-10" />
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isRemoteMicOn ? 'On voice call...' : 'Mic Off'}
              </p>
            </div>
          </div>
        )}

        {callActive && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mb-4">
            {formatTime(seconds)}
          </p>
        )}

        <div className="flex justify-center items-center gap-4 mt-2">
          <button
            onClick={handleMicToggle}
            className={`p-3 rounded-full ${
              micLoading ? 'bg-gray-400' : 'bg-gray-200 dark:bg-gray-700'
            } hover:scale-110 transition`}
            aria-label="Toggle Microphone"
            disabled={micLoading}
          >
            {micLoading ? (
              <span>Loading...</span>
            ) : isMicOn ? (
              <Mic className="text-green-500" />
            ) : (
              <MicOff className="text-red-500" />
            )}
          </button>

          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition"
              aria-label="Toggle Video"
            >
              {isVideoOn ? (
                <Video className="text-green-500" />
              ) : (
                <VideoOff className="text-red-500" />
              )}
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
            aria-label="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* ✅ Voice call playback only for remote */}
        {callType === 'voice' && <audio ref={remoteAudioRef} autoPlay playsInline />}
      </div>
    </div>
  );
};

export default CallUI;
