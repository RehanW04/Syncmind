import React, { useState } from 'react';
import { Captions, Check, Copy, Maximize2, Mic, MicOff, Minimize2, Video, VideoOff, MonitorUp, MessageSquare, PhoneOff, Users, Hand, Smile } from 'lucide-react';

import { useWebRTCContext } from '../../context/WebRTCContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MeetingControls({
  activeTab, showSidebar, toggleChat, onLeave, toggleParticipants, toggleTranscript, isFullscreen, toggleFullscreen, isHost, roomId
}) {
  const {
    isMuted, handleToggleMute,
    isVideoOff, handleToggleVideo,
    isScreenSharing, handleToggleScreenShare,
    isHandRaised, handleToggleHandRaise,
    handleSendReaction,
    endMeetingForAll, muteAll
  } = useWebRTCContext();

  const [showEmojis, setShowEmojis] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const EMOJIS = ['👍', '👏', '🎉', '😂', '❤️', '😮'];

  const btnBase = 'w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-xl transition-all relative';
  const btnOff = 'bg-white/50 border border-white/40 hover:bg-white/70 text-[#1d1d1f] shadow-sm';
  const btnOn = 'bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white border border-[#FF3B30]/20 shadow-md shadow-red-500/20';
  const btnActive = 'bg-[#007AFF] hover:bg-[#007AFF]/90 text-white border border-[#007AFF]/20 shadow-md shadow-blue-500/20';
  const btnWarning = 'bg-[#FF9500] hover:bg-[#FF9500]/90 text-white border border-[#FF9500]/20 shadow-md shadow-orange-500/20';

  const handleEndMeeting = async () => {
    if (isEndingMeeting) return;
    setIsEndingMeeting(true);

    try {
      await fetch(`${API_URL}/meetings/${roomId}/summary`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to generate meeting summary before ending:', error);
    } finally {
      endMeetingForAll();
      onLeave();
      setIsEndingMeeting(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}`);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 1800);
    } catch (error) {
      console.error('Failed to copy meeting link:', error);
    }
  };

  return (
    <div className="glass-card meeting-controls-panel px-6 py-3 flex items-center justify-center gap-3" style={{ borderRadius: '100px' }}>
      <button onClick={handleToggleMute} className={`${btnBase} ${isMuted ? btnOn : btnOff}`} title={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <button onClick={handleToggleVideo} className={`${btnBase} ${isVideoOff ? btnOn : btnOff}`} title={isVideoOff ? 'Start Video' : 'Stop Video'}>
        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>
      <button onClick={handleToggleScreenShare} className={`${btnBase} ${isScreenSharing ? btnActive : btnOff}`} title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
        <MonitorUp className="w-5 h-5" />
      </button>
      <button onClick={toggleFullscreen} className={`${btnBase} ${isFullscreen ? btnActive : btnOff}`} title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}>
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      <div className="w-px h-8 bg-black/[0.06] mx-1" />

      <button onClick={handleToggleHandRaise} className={`${btnBase} ${isHandRaised ? btnWarning : btnOff}`} title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}>
        <Hand className="w-5 h-5" />
      </button>
      <button onClick={toggleTranscript} className={`${btnBase} ${showSidebar && activeTab === 'transcript' ? btnActive : btnOff}`} title="Live Transcript">
        <Captions className="w-5 h-5" />
      </button>

      <div className="relative">
        <button onClick={() => setShowEmojis(!showEmojis)} className={`${btnBase} ${showEmojis ? btnActive : btnOff}`} title="Reactions">
          <Smile className="w-5 h-5" />
        </button>
        {showEmojis && (
          <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-xl border border-black/5">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => { handleSendReaction(emoji); setShowEmojis(false); }}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-black/5 rounded-full transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-8 bg-black/[0.06] mx-1" />

      <button onClick={toggleParticipants} className={`${btnBase} ${showSidebar && activeTab === 'participants' ? btnActive : btnOff}`} title="Participants">
        <Users className="w-5 h-5" />
      </button>
      <button onClick={toggleChat} className={`${btnBase} ${showSidebar && activeTab === 'qa' ? btnActive : btnOff}`} title="AI Assistant">
        <MessageSquare className="w-5 h-5" />
      </button>
      <button onClick={copyInviteLink} className={`${btnBase} ${copiedInvite ? btnActive : btnOff}`} title={copiedInvite ? 'Copied' : 'Copy Invite Link'}>
        {copiedInvite ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
      </button>

      {isHost && (
        <>
          <div className="w-px h-8 bg-black/[0.06] mx-1" />
          <button onClick={muteAll} className="px-4 py-2.5 bg-[#FF9500] hover:bg-[#FF9500]/90 text-white font-semibold rounded-full flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-orange-500/25 tracking-tight text-sm">
            <MicOff className="w-4 h-4" /> Mute All
          </button>
          <button
            onClick={handleEndMeeting}
            disabled={isEndingMeeting}
            className="px-4 py-2.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white font-semibold rounded-full flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-red-500/25 tracking-tight text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <PhoneOff className="w-4 h-4" /> {isEndingMeeting ? 'Ending...' : 'End for All'}
          </button>
        </>
      )}

      {!isHost && (
        <>
          <div className="w-px h-8 bg-black/[0.06] mx-1" />
          <button onClick={onLeave} className="px-5 py-2.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white font-semibold rounded-full flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-red-500/25 tracking-tight text-sm">
            <PhoneOff className="w-5 h-5" /> Leave
          </button>
        </>
      )}
    </div>
  );
}
