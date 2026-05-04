import React, { createContext, useContext, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';

const WebRTCContext = createContext(null);

export const WebRTCProvider = ({ roomId, userId, userName, initialSettings, children }) => {
  const {
    localStream,
    peers,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    screenStream,
    transcripts,
    isTranscribing,
    toggleHandRaise,
    sendReaction,
    notifications,
    endMeetingForAll,
    kickUser,
    muteAll
  } = useWebRTC(roomId, userId, userName, initialSettings);

  const [isMuted, setIsMuted] = useState(initialSettings?.isMuted || false);
  const [isVideoOff, setIsVideoOff] = useState(initialSettings?.isVideoOff || false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [localReaction, setLocalReaction] = useState(null);

  const handleToggleMute = () => { setIsMuted(toggleAudio()); };
  const handleToggleVideo = () => { setIsVideoOff(toggleVideo()); };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const success = await startScreenShare();
      if (success) setIsScreenSharing(true);
    }
  };

  const handleToggleHandRaise = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    toggleHandRaise(newState);
  };

  const handleSendReaction = (emoji) => {
    setLocalReaction(emoji);
    sendReaction(emoji);
    setTimeout(() => {
      setLocalReaction((current) => current === emoji ? null : current);
    }, 4000);
  };

  const participantCount = 1 + (peers?.length || 0);

  const value = {
    localStream,
    peers,
    screenStream,
    transcripts,
    isTranscribing,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    localReaction,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleToggleHandRaise,
    handleSendReaction,
    participantCount,
    notifications,
    endMeetingForAll,
    kickUser,
    muteAll,
    roomId,
    userId,
    userName
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTCContext = () => useContext(WebRTCContext);
