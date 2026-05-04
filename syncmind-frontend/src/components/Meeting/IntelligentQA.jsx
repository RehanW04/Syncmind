import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function IntelligentQA({ meetingId }) {
  const [queries, setQueries] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [queries, isTyping]);

  const handleAsk = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const question = input.trim();
    setInput('');
    setQueries(prev => [...prev, { role: 'user', text: question }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/meetings/${meetingId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI assistant is unavailable right now.');

      setQueries(prev => [...prev, {
        role: 'ai',
        text: data.answer,
        confidence: typeof data.confidence === 'number' ? data.confidence : null,
        sources: Array.isArray(data.sources) ? data.sources : []
      }]);
    } catch (error) {
      setQueries(prev => [...prev, {
        role: 'ai',
        text: error.message || 'AI assistant is unavailable right now.',
        confidence: null,
        sources: []
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {queries.length === 0 && (
          <div className="text-center text-[#98989d] mt-10 text-sm font-medium">
            Ask questions about the meeting. I&apos;ll analyze the transcript to answer.
          </div>
        )}

        {queries.map((query, idx) => (
          <div key={idx} className={`p-3.5 rounded-2xl border ${
            query.role === 'user'
              ? 'bg-[#007AFF] border-[#007AFF]/20 ml-8 text-white'
              : 'bg-white/40 border-white/30 mr-8 backdrop-blur-sm'
          }`}>
            <span className={`text-xs font-semibold block mb-1 ${query.role === 'user' ? 'text-white/70' : 'text-[#007AFF]'}`}>
              {query.role === 'user' ? 'You' : 'SyncMind AI'}
            </span>
            <p className={`text-sm ${query.role === 'user' ? 'text-white' : 'text-[#1d1d1f]'}`}>{query.text}</p>
            {typeof query.confidence === 'number' && (
              <span className="text-[10px] text-[#98989d] mt-1 block font-medium">
                Confidence: {Math.round(query.confidence * 100)}%
              </span>
            )}
            {query.role === 'ai' && query.sources?.length > 0 && (
              <span className="text-[10px] text-[#98989d] mt-1 block font-medium">
                Sources: {query.sources.map(source => source.speaker).filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="text-sm text-[#6e6e73] italic flex items-center gap-2 font-medium">
            <div className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            Analyzing transcript...
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-black/[0.04]">
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Ask about a decision, action item..."
            className="flex-grow bg-white/50 border border-white/40 backdrop-blur-sm rounded-xl p-3 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all placeholder-[#98989d]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white p-3 rounded-xl hover:brightness-110 disabled:opacity-40 transition-all shadow-sm shadow-blue-500/15"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
