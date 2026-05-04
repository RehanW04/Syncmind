import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Brain, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PreMeetingCard({ onJoin, roomId }) {
  const { user } = useAuth();
  const meetingDefaults = user?.preferences?.settings || {};
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(meetingDefaults.joinMuted || false);
  const [isVideoOff, setIsVideoOff] = useState(meetingDefaults.joinVideoOff || false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.name) setUserName(user.name);
  }, [user]);

  useEffect(() => {
    let activeStream = null;
    const audioConstraints = {
      deviceId: meetingDefaults.preferredMicrophoneId ? { exact: meetingDefaults.preferredMicrophoneId } : undefined,
      noiseSuppression: meetingDefaults.noiseSuppression ?? true,
      echoCancellation: meetingDefaults.echoCancellation ?? true,
      autoGainControl: meetingDefaults.autoGainControl ?? true
    };
    const videoConstraints = meetingDefaults.preferredCameraId
      ? { deviceId: { exact: meetingDefaults.preferredCameraId } }
      : true;

    const startPreview = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints });
      } catch {
        return navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            noiseSuppression: meetingDefaults.noiseSuppression ?? true,
            echoCancellation: meetingDefaults.echoCancellation ?? true,
            autoGainControl: meetingDefaults.autoGainControl ?? true
          }
        });
      }
    };

    startPreview()
      .then(s => {
        activeStream = s;
        s.getAudioTracks().forEach((track) => { track.enabled = !(meetingDefaults.joinMuted || false); });
        s.getVideoTracks().forEach((track) => { track.enabled = !(meetingDefaults.joinVideoOff || false); });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError('Camera/mic access denied. You can still join.'));
    return () => { if (activeStream) activeStream.getTracks().forEach(t => t.stop()); };
  }, [meetingDefaults.autoGainControl, meetingDefaults.echoCancellation, meetingDefaults.joinMuted, meetingDefaults.joinVideoOff, meetingDefaults.noiseSuppression, meetingDefaults.preferredCameraId, meetingDefaults.preferredMicrophoneId]);

  const toggleVideo = () => {
    if (stream) {
      const t = stream.getVideoTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const t = stream.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
    }
  };

  const handleJoin = () => {
    if (!userName.trim()) {
      setError('Please enter your name to join.');
      return;
    }
    if (stream) stream.getTracks().forEach(t => t.stop());
    onJoin({
      isMuted,
      isVideoOff,
      userName: userName.trim(),
      preferredCameraId: meetingDefaults.preferredCameraId || '',
      preferredMicrophoneId: meetingDefaults.preferredMicrophoneId || '',
      noiseSuppression: meetingDefaults.noiseSuppression ?? true,
      echoCancellation: meetingDefaults.echoCancellation ?? true,
      autoGainControl: meetingDefaults.autoGainControl ?? true,
      autoTranscription: meetingDefaults.autoTranscription ?? true
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-screen relative">
      <div className="liquid-orb" style={{ top: '-15%', left: '30%', width: '500px', height: '500px', background: 'rgba(0, 122, 255, 0.06)' }} />
      <div className="liquid-orb" style={{ bottom: '-10%', right: '20%', width: '300px', height: '300px', background: 'rgba(175, 82, 222, 0.04)', animationDelay: '3s' }} />

      <div className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-md shadow-blue-500/20">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-[#1d1d1f]">SyncMind</span>
      </div>

      <h2 className="text-2xl font-bold mb-1 relative z-10 tracking-tight text-[#1d1d1f]">Ready to join?</h2>
      <p className="text-[#98989d] mb-8 text-sm relative z-10">Room: {roomId}</p>

      {error && <p className="text-[#FF9500] text-sm mb-4 relative z-10 font-medium">{error}</p>}

      <div className="relative w-full max-w-xl aspect-video rounded-2xl overflow-hidden mb-6 glass-card border-0 z-10 shadow-lg">
        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e8e6e3] to-[#dddad5]">
            <div className="w-20 h-20 bg-white/50 flex items-center justify-center rounded-full border border-white/40 backdrop-blur-xl">
              <VideoOff className="w-8 h-8 text-[#98989d]" />
            </div>
          </div>
        )}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-3">
          <button onClick={toggleAudio} className={`p-3.5 rounded-full backdrop-blur-xl transition-all ${isMuted ? 'bg-[#FF3B30] hover:bg-[#FF3B30]/90 shadow-lg shadow-red-500/20' : 'bg-white/50 border border-white/40 hover:bg-white/70 text-[#1d1d1f] shadow-sm'}`}>
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={toggleVideo} className={`p-3.5 rounded-full backdrop-blur-xl transition-all ${isVideoOff ? 'bg-[#FF3B30] hover:bg-[#FF3B30]/90 shadow-lg shadow-red-500/20' : 'bg-white/50 border border-white/40 hover:bg-white/70 text-[#1d1d1f] shadow-sm'}`}>
            {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm relative z-10 mb-6">
        <div className="flex items-center bg-white/50 border border-white/40 rounded-xl px-4 py-3 backdrop-blur-xl focus-within:ring-2 ring-[#007AFF]/50 transition-all">
          <User className="w-5 h-5 text-[#98989d] mr-3" />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="bg-transparent border-none outline-none text-[#1d1d1f] w-full placeholder-[#98989d] font-medium"
          />
        </div>
      </div>

      <button onClick={handleJoin} className="px-10 py-3.5 bg-gradient-to-r from-[#007AFF] to-[#5856D6] hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/25 text-white font-semibold rounded-2xl text-base transition-all w-full max-w-sm relative z-10 tracking-tight hover:-translate-y-0.5">
        Join Now
      </button>
    </div>
  );
}
