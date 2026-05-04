import React, { useEffect, useMemo, useRef } from 'react';
import { Hand, VideoOff } from 'lucide-react';
import { useWebRTCContext } from '../../context/WebRTCContext';

function getInitials(name = '') {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getAvatarTone(name = '') {
  const tones = ['tone-blue', 'tone-amber', 'tone-green', 'tone-rose', 'tone-indigo'];
  const seed = Array.from(String(name)).reduce((total, char) => total + char.charCodeAt(0), 0);
  return tones[seed % tones.length];
}

const VideoPeer = ({ stream, isLocal, name, isHandRaised, reaction, isVideoOff }) => {
  const videoRef = useRef(null);
  const initials = getInitials(name);
  const avatarTone = getAvatarTone(name);
  const showVideo = Boolean(stream) && !isVideoOff;

  useEffect(() => {
    if (videoRef.current && showVideo) {
      videoRef.current.srcObject = stream;
    }
  }, [showVideo, stream]);

  return (
    <div className="video-tile">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="video-element"
        />
      ) : (
        <div className="video-placeholder">
          <div className={`video-avatar ${avatarTone}`}>
            <span className="video-avatar-text">{initials}</span>
          </div>
          <div className="video-status-pill">
            {isVideoOff ? (
              <>
                <VideoOff className="video-status-icon" />
                <span>Camera off</span>
              </>
            ) : (
              <span>Connecting...</span>
            )}
          </div>
        </div>
      )}
      {isHandRaised && (
        <div className="absolute top-4 right-4 bg-[#FF9500] text-white p-2 rounded-full shadow-lg shadow-orange-500/30 border border-white/20 z-10 flex items-center justify-center animate-bounce">
          <Hand className="w-5 h-5 fill-current" />
        </div>
      )}
      {reaction && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-7xl animate-[ping_1.5s_ease-out_forwards]">{reaction}</div>
        </div>
      )}
      <div className="video-nameplate">
        <span className="video-nameplate-text">
          {name}
          {isLocal && ' (You)'}
        </span>
      </div>
      {isLocal && <div className="video-you-badge">YOU</div>}
    </div>
  );
};

export default function VideoGrid() {
  const { localStream, screenStream, peers, isHandRaised, localReaction, isVideoOff, userName } = useWebRTCContext();
  const streamToRender = screenStream || localStream;
  const total = 1 + (peers?.length || 0);

  const layout = useMemo(() => {
    if (total === 1) return { cols: 1, rows: 1, className: 'vg-solo' };
    if (total === 2) return { cols: 2, rows: 1, className: 'vg-duo' };
    if (total === 3) return { cols: 3, rows: 1, className: 'vg-trio' };
    if (total === 4) return { cols: 2, rows: 2, className: 'vg-quad' };
    if (total <= 6) return { cols: 3, rows: 2, className: 'vg-six' };
    if (total <= 9) return { cols: 3, rows: 3, className: 'vg-nine' };
    return { cols: 4, rows: Math.ceil(total / 4), className: 'vg-large' };
  }, [total]);

  return (
    <div className={`video-grid ${layout.className}`}>
      {streamToRender && (
        <VideoPeer
          stream={streamToRender}
          isLocal={true}
          name={userName || 'You'}
          isHandRaised={isHandRaised}
          reaction={localReaction}
          isVideoOff={Boolean(!screenStream && isVideoOff)}
        />
      )}
      {peers && peers.map((peer) => (
        <VideoPeer
          key={peer.peerId}
          stream={peer.stream}
          isLocal={false}
          name={peer.userName || 'Participant'}
          isHandRaised={peer.isHandRaised}
          reaction={peer.reaction}
          isVideoOff={peer.isVideoOff}
        />
      ))}
    </div>
  );
}
