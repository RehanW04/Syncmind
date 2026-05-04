import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PreMeetingCard from '../components/Meeting/PreMeetingCard';
import ActiveMeetingRoom from '../components/Meeting/ActiveMeetingRoom';
import { WebRTCProvider } from '../context/WebRTCContext';
import { Brain } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function LiveMeetingPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userSettings = user?.preferences?.settings || {};

  const [joinState, setJoinState] = useState('prejoin'); // 'prejoin' | 'waiting' | 'joined'
  const [meetingSettings, setMeetingSettings] = useState({
    isMuted: userSettings.joinMuted || false,
    isVideoOff: userSettings.joinVideoOff || false,
    userName: user?.name || '',
    preferredCameraId: userSettings.preferredCameraId || '',
    preferredMicrophoneId: userSettings.preferredMicrophoneId || '',
    noiseSuppression: userSettings.noiseSuppression ?? true,
    echoCancellation: userSettings.echoCancellation ?? true,
    autoGainControl: userSettings.autoGainControl ?? true,
    autoTranscription: userSettings.autoTranscription ?? true
  });
  const [meetingData, setMeetingData] = useState(null);
  const userId = user?.id || Math.random().toString(36).substring(7);

  React.useEffect(() => {
    fetch(`${API_URL}/meetings/${roomId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setMeetingData(data);
      })
      .catch(console.error);
  }, [roomId]);

  const isHost = meetingData?.host_id === user?.id && user !== null;

  const handleAskToJoin = (settings) => {
    setMeetingSettings(settings);
    setJoinState('waiting');
    // Simulate host admitting after 2.5 seconds
    setTimeout(() => setJoinState('joined'), 2500);
  };

  if (joinState === 'prejoin') {
    return <PreMeetingCard roomId={roomId} onJoin={handleAskToJoin} />;
  }

  if (joinState === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative">
        <div className="liquid-orb" style={{ top: '20%', left: '30%', width: '400px', height: '400px', background: 'rgba(0, 122, 255, 0.06)' }} />
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-md shadow-blue-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1d1d1f]">SyncMind</span>
        </div>
        <div className="w-14 h-14 border-[3px] border-[#007AFF] border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-semibold mb-2 tracking-tight text-[#1d1d1f]">Waiting to be admitted...</h2>
        <p className="text-[#98989d] text-sm">Room: {roomId}</p>
      </div>
    );
  }

  return (
    <WebRTCProvider roomId={roomId} userId={userId} userName={meetingSettings.userName} initialSettings={meetingSettings}>
      <ActiveMeetingRoom onLeave={() => navigate('/dashboard')} isHost={isHost} roomId={roomId} />
    </WebRTCProvider>
  );
}
