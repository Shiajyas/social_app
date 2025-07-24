import React, { useEffect, useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User,
} from 'lucide-react';
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
  otherUser?: { username: string; avatar?: string };
  callActive: boolean;
  incomingCall: boolean;
  onCallAccepted?: () => void;
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
  const [ringback, setRingback] = useState<HTMLAudioElement | null>(null);
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);
  const [micLoading, setMicLoading] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  // ⏱ Call duration timer
  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  // 🔊 Setup ringtone and ringback
  useEffect(() => {
    const ringbackAudio = new Audio('/sounds/outgoing-ring.mp3');
    const ringtoneAudio = new Audio('/sounds/ringtone.mp3');
    ringbackAudio.loop = true;
    ringtoneAudio.loop = true;
    setRingback(ringbackAudio);
    setRingtone(ringtoneAudio);
  }, []);

  useEffect(() => {
    if (!ringback || !ringtone) return;

    if (incomingCall) {
      ringtone.play().catch(() => {});
      ringback.pause();
    } else if (!callActive) {
      ringback.play().catch(() => {});
      ringtone.pause();
    } else {
      ringback.pause();
      ringtone.pause();
    }

    return () => {
      ringback?.pause();
      ringtone?.pause();
    };
  }, [incomingCall, callActive, ringback, ringtone]);

  // 🔁 Assign video/audio streams
  useEffect(() => {
    const localVideo = document.getElementById('local-video') as HTMLVideoElement | null;
    const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement | null;

    if (callType === 'video') {
      if (localVideo && localStream) localVideo.srcObject = localStream;
      if (remoteVideo && remoteStream) remoteVideo.srcObject = remoteStream;
    }

    if (callType === 'voice' && remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, callType, remoteAudioRef]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleMicToggle = async () => {
    setMicLoading(true);
    try {
      onToggleMic();
    } finally {
      setMicLoading(false);
    }
  };

  const handleEndCall = () => {
    setCallEnded(true);
    setTimeout(() => onClose(), 1000);
  };

  useEffect(() => {
    gsap.fromTo(
      '.call-modal',
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
    );
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="call-modal bg-white dark:bg-gray-900 rounded-2xl p-6 w-[90%] sm:w-96 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg text-center font-semibold mb-4 text-gray-800 dark:text-white">
          {callType === 'voice' ? 'Voice Call' : 'Video Call'}
        </h2>

        {callType === 'video' ? (
          <div className="relative w-full h-64 bg-black mb-4 rounded-xl overflow-hidden">
            <video id="remote-video" autoPlay playsInline className="w-full h-full object-cover" />
            <video
              id="local-video"
              autoPlay
              muted
              playsInline
              className="absolute bottom-2 right-2 w-24 h-24 sm:w-28 sm:h-28 border-2 border-white rounded-lg object-cover"
            />
            {!isRemoteVideoOn && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">
                Camera Off
              </div>
            )}
            {!isRemoteMicOn && (
              <div className="absolute bottom-3 left-3 text-white bg-blue-600 p-2 rounded-full">
                <MicOff className="w-5 h-5" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-4">
            <div className="flex flex-col items-center">
              {otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  className="w-20 h-20 rounded-full object-cover"
                  alt={otherUser.username}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isRemoteMicOn ? 'On voice call...' : 'Mic Off'}
              </span>
            </div>
          </div>
        )}

        {callActive && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mb-4">
            {formatTime(seconds)}
          </p>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleMicToggle}
            disabled={micLoading}
            className={`p-3 rounded-full ${
              micLoading ? 'bg-gray-400' : 'bg-gray-200 dark:bg-gray-700'
            } hover:scale-105 transition`}
          >
            {micLoading ? (
              <span className="text-xs text-gray-500">...</span>
            ) : isMicOn ? (
              <Mic className="text-green-500" />
            ) : (
              <MicOff className="text-red-500" />
            )}
          </button>

          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-105 transition"
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
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {callType === 'voice' && (
          <audio id="remote-audio" ref={remoteAudioRef} autoPlay hidden />
        )}
      </div>
    </div>
  );
};

export default CallUI;
