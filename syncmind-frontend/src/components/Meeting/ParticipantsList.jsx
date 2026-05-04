import React from 'react';
import { User, Hand, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useWebRTCContext } from '../../context/WebRTCContext';

export default function ParticipantsList({ isHost }) {
  const { peers, isMuted, isVideoOff, isHandRaised, kickUser } = useWebRTCContext();

  return (
    <div className="flex flex-col h-full bg-white/30 p-4 overflow-y-auto space-y-2">
      <h3 className="text-sm font-semibold text-[#1d1d1f] mb-2 px-2">In this room</h3>
      
      {/* Local User */}
      <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#1d1d1f]">You</span>
            {isHandRaised && <span className="text-[10px] text-[#FF9500] font-bold uppercase tracking-wider flex items-center gap-1"><Hand className="w-3 h-3"/> Hand Raised</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#98989d]">
          {isMuted ? <MicOff className="w-4 h-4 text-[#FF3B30]"/> : <Mic className="w-4 h-4 text-[#34C759]"/>}
          {isVideoOff ? <VideoOff className="w-4 h-4 text-[#FF3B30]"/> : <Video className="w-4 h-4 text-[#34C759]"/>}
        </div>
      </div>

      {/* Remote Peers */}
      {peers.map(peer => (
        <div key={peer.peerId} className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-3 rounded-xl border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#1d1d1f]">{peer.userName || 'Participant'}</span>
              {peer.isHandRaised && <span className="text-[10px] text-[#FF9500] font-bold uppercase tracking-wider flex items-center gap-1"><Hand className="w-3 h-3"/> Hand Raised</span>}
            </div>
          </div>
          {isHost && (
            <button onClick={() => kickUser(peer.peerId)} className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
              Kick
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
