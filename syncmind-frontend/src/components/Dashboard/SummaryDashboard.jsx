import React from 'react';
import { Zap, CheckCircle2, ClipboardList, X, Calendar, Clock, FileText } from 'lucide-react';

export default function SummaryDashboard({ meetingData, onClose }) {
  if (!meetingData) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/8 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-[#007AFF]" />
        </div>
        <p className="text-sm text-[#6e6e73] mb-1 font-medium">No summary selected</p>
        <p className="text-xs text-[#98989d] max-w-[260px]">
          Click on a meeting from your history to view its AI-powered summary.
        </p>
      </div>
    );
  }

  const actionItems = meetingData.actionItems || [];
  const keyDecisions = meetingData.keyDecisions || [];

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="relative p-6 pb-4 border-b border-black/[0.04]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#007AFF] to-[#5856D6]" />
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className="text-xs font-semibold text-[#007AFF] uppercase tracking-wider mb-2 block">AI Summary</span>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 tracking-tight">{meetingData.title}</h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-[#98989d] font-medium">
                <Calendar className="w-3 h-3" /> {meetingData.date}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#98989d] font-medium">
                <Clock className="w-3 h-3" /> {meetingData.duration}
              </span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/40 border border-white/30 hover:bg-white/60 transition-all text-[#98989d] hover:text-[#1d1d1f]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
        <section>
          <h3 className="text-sm font-semibold text-[#007AFF] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Executive Summary
          </h3>
          <div className="rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/10 p-4">
            <p className="text-sm text-[#1d1d1f] leading-relaxed">{meetingData.executiveSummary}</p>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#FF3B30] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Action Items
            <span className="text-xs bg-[#FF3B30]/8 text-[#FF3B30] px-2 py-0.5 rounded-full ml-auto font-semibold">{actionItems.length} items</span>
          </h3>
          <div className="space-y-2.5">
            {actionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-[#FF3B30]/[0.04] border border-[#FF3B30]/10 p-3.5">
                <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 bg-transparent accent-[#007AFF] cursor-pointer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1d1d1f] leading-relaxed">
                    <span className="font-semibold text-[#FF3B30]">{item.assignee}:</span> {item.task}
                  </p>
                  {item.due && <span className="text-[10px] text-[#98989d] mt-1 inline-block font-medium">Due: {item.due}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#5856D6] mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Key Decisions
          </h3>
          <div className="space-y-2">
            {keyDecisions.map((decision, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-[#5856D6]/[0.04] border border-[#5856D6]/10 p-3.5">
                <div className="w-5 h-5 rounded-full bg-[#5856D6]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[#5856D6]">{i + 1}</span>
                </div>
                <p className="text-sm text-[#1d1d1f] leading-relaxed">{decision}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}