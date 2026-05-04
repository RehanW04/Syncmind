import React, { useEffect, useRef } from 'react';
import { useWebRTCContext } from '../../context/WebRTCContext';

export default function LiveTranscript({ isListening }) {
  const { transcripts } = useWebRTCContext();
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcripts]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto space-y-3 p-4" ref={scrollRef}>
        {transcripts.map((msg, idx) => (
          <div key={msg.transcriptId || idx} className="bg-white/30 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
            <span className={`text-xs font-semibold block mb-1 ${msg.isLocal ? 'text-[#007AFF]' : 'text-[#5856D6]'}`}>
              {msg.speaker}
            </span>
            <p className="text-sm text-[#1d1d1f]">{msg.text}</p>
          </div>
        ))}
        {isListening && (
          <div className="bg-[#007AFF]/[0.04] p-3 rounded-2xl border border-[#007AFF]/15 border-dashed">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-ping" />
              <span className="text-xs text-[#007AFF] italic font-medium">Transcribing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
