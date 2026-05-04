import React, { useEffect, useRef, useState } from 'react';
import { useWebRTCContext } from '../../context/WebRTCContext';
import VideoGrid from './VideoGrid';
import MeetingControls from './MeetingControls';
import LiveTranscript from './LiveTranscript';
import IntelligentQA from './IntelligentQA';
import ParticipantsList from './ParticipantsList';
import { Brain, Users, ChevronRight, ChevronLeft } from 'lucide-react';

export default function ActiveMeetingRoom({ onLeave, isHost }) {
  const [activeTab, setActiveTab] = useState('participants');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const meetingRoomRef = useRef(null);
  const controlsTimerRef = useRef(null);

  const { roomId, participantCount, notifications, isTranscribing } = useWebRTCContext();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === meetingRoomRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const revealControls = () => {
      setControlsVisible(true);
      window.clearTimeout(controlsTimerRef.current);
      if (!isFullscreen) return;
      controlsTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 2600);
    };

    revealControls();
    return () => window.clearTimeout(controlsTimerRef.current);
  }, [isFullscreen]);

  const handleActivity = () => {
    setControlsVisible(true);
    window.clearTimeout(controlsTimerRef.current);
    if (!isFullscreen) return;
    controlsTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2600);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await meetingRoomRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      handleActivity();
    } catch (error) {
      console.error('Unable to toggle fullscreen:', error);
    }
  };

  const toggleParticipants = () => {
    if (activeTab === 'participants' && showSidebar) {
      setShowSidebar(false);
    } else {
      setActiveTab('participants');
      setShowSidebar(true);
    }
  };

  const toggleChat = () => {
    if (activeTab === 'qa' && showSidebar) {
      setShowSidebar(false);
    } else {
      setActiveTab('qa');
      setShowSidebar(true);
    }
  };

  const toggleTranscript = () => {
    if (activeTab === 'transcript' && showSidebar) {
      setShowSidebar(false);
    } else {
      setActiveTab('transcript');
      setShowSidebar(true);
    }
  };

  return (
    <div
      ref={meetingRoomRef}
      className={`meeting-room relative ${isFullscreen ? 'meeting-room-fullscreen' : ''}`}
      onMouseMove={handleActivity}
      onTouchStart={handleActivity}
      onKeyDown={handleActivity}
    >
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {notifications?.map((msg, i) => (
          <div key={i} className="bg-black/80 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full shadow-lg shadow-black/20 animate-fade-in pointer-events-auto">
            {msg}
          </div>
        ))}
      </div>

      <header className="meeting-header">
        <div className="meeting-header-left">
          <div className="meeting-logo">
            <Brain className="w-4 h-4" />
          </div>
          <span className="meeting-brand">SyncMind</span>
          <span className="meeting-room-id">{roomId}</span>
        </div>
        <div className="meeting-header-right">
          <span className="meeting-participant-count">
            <Users className="w-3.5 h-3.5" /> {participantCount}
          </span>
          <div className="meeting-recording-badge">
            <div className="meeting-recording-dot" />
            <span>Recording</span>
          </div>
        </div>
      </header>

      <div className="meeting-body">
        <main className="meeting-video-area">
          <div className="meeting-video-container">
            <VideoGrid />
          </div>

          <div className={`meeting-controls-dock ${controlsVisible ? 'meeting-controls-visible' : 'meeting-controls-hidden'}`}>
            <MeetingControls
              activeTab={activeTab}
              showSidebar={showSidebar}
              toggleChat={toggleChat}
              toggleParticipants={toggleParticipants}
              toggleTranscript={toggleTranscript}
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              onLeave={onLeave}
              isHost={isHost}
              roomId={roomId}
            />
          </div>
        </main>

        {!showSidebar && (
          <button
            className="meeting-sidebar-toggle"
            onClick={() => setShowSidebar(true)}
            title="Open panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <aside className={`meeting-sidebar ${showSidebar ? 'meeting-sidebar-open' : 'meeting-sidebar-closed'}`}>
          {showSidebar && (
            <>
              <div className="meeting-sidebar-tabs">
                <button
                  className={`meeting-sidebar-tab ${activeTab === 'participants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('participants')}
                >
                  People
                </button>
                <button
                  className={`meeting-sidebar-tab ${activeTab === 'transcript' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transcript')}
                >
                  Transcript
                </button>
                <button
                  className={`meeting-sidebar-tab ${activeTab === 'qa' ? 'active' : ''}`}
                  onClick={() => setActiveTab('qa')}
                >
                  AI Assistant
                </button>
                <button
                  className="meeting-sidebar-close"
                  onClick={() => setShowSidebar(false)}
                  title="Close panel"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="meeting-sidebar-content">
                {activeTab === 'participants' && <ParticipantsList isHost={isHost} />}
                {activeTab === 'transcript' && <LiveTranscript isListening={isTranscribing} />}
                {activeTab === 'qa' && <IntelligentQA meetingId={roomId} />}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
