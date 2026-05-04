import React, { createContext, useState, useContext } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MeetingContext = createContext(null);

export const MeetingProvider = ({ children }) => {
  const [pastMeetings, setPastMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Recycle bin: stored in component state (session-based soft delete)
  const [trashedMeetings, setTrashedMeetings] = useState([]);

  const fetchMeetingSummaries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/meetings`);
      if (res.ok) {
        const data = await res.json();
        // Exclude any already-trashed IDs from the list
        setTrashedMeetings(prev => {
          const trashedIds = new Set(prev.map(m => m.id));
          setPastMeetings(data.filter(m => m.status !== 'scheduled' && !trashedIds.has(m.id)));
          setUpcomingMeetings(data.filter(m => m.status === 'scheduled'));
          return prev;
        });
      }
    } catch {
      // Backend unavailable
    }
    setIsLoading(false);
  };

  const fetchUpcoming = async () => {
    try {
      const res = await fetch(`${API_URL}/meetings/upcoming`);
      if (res.ok) {
        const data = await res.json();
        setUpcomingMeetings(data);
      }
    } catch {
      // Backend unavailable
    }
  };

  const viewSummary = (meetingId) => {
    const summary = pastMeetings.find(m => m.id === meetingId);
    setSelectedSummary(summary);
  };

  const createMeeting = async (title, hostId) => {
    try {
      const res = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, hostId })
      });
      if (res.ok) return await res.json();
    } catch {}
    return { id: Math.random().toString(36).substring(2, 9) };
  };

  const scheduleMeeting = async (title, scheduledAt, hostId) => {
    try {
      const res = await fetch(`${API_URL}/meetings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, scheduledAt, hostId })
      });
      if (res.ok) {
        const data = await res.json();
        setUpcomingMeetings(prev => [...prev, data].sort((a, b) =>
          (a.scheduledAt || '').localeCompare(b.scheduledAt || '')
        ));
        return data;
      }
    } catch {}
    const fallback = {
      id: Math.random().toString(36).substring(2, 9),
      title, scheduledAt, status: 'scheduled'
    };
    setUpcomingMeetings(prev => [...prev, fallback]);
    return fallback;
  };

  const cancelMeeting = async (meetingId) => {
    try {
      await fetch(`${API_URL}/meetings/${meetingId}`, { method: 'DELETE' });
    } catch {}
    setUpcomingMeetings(prev => prev.filter(m => m.id !== meetingId));
  };

  // Move a past meeting to the recycle bin (soft delete — no API call yet)
  const trashMeeting = (meetingId) => {
    setPastMeetings(prev => {
      const meeting = prev.find(m => m.id === meetingId);
      if (meeting) {
        setTrashedMeetings(t => [...t, { ...meeting, trashedAt: new Date().toISOString() }]);
        if (selectedSummary?.id === meetingId) setSelectedSummary(null);
      }
      return prev.filter(m => m.id !== meetingId);
    });
  };

  // Restore a meeting from the recycle bin back to the list
  const restoreMeeting = (meetingId) => {
    setTrashedMeetings(prev => {
      const meeting = prev.find(m => m.id === meetingId);
      if (meeting) {
        const { trashedAt, ...restored } = meeting;
        setPastMeetings(p => [restored, ...p]);
      }
      return prev.filter(m => m.id !== meetingId);
    });
  };

  // Permanently delete a meeting from the recycle bin (real API call)
  const permanentlyDeleteMeeting = async (meetingId) => {
    try {
      await fetch(`${API_URL}/meetings/${meetingId}`, { method: 'DELETE' });
    } catch {}
    setTrashedMeetings(prev => prev.filter(m => m.id !== meetingId));
  };

  // Empty the entire recycle bin (delete all trashed meetings from backend)
  const emptyTrash = async () => {
    const ids = trashedMeetings.map(m => m.id);
    await Promise.allSettled(
      ids.map(id => fetch(`${API_URL}/meetings/${id}`, { method: 'DELETE' }))
    );
    setTrashedMeetings([]);
  };

  return (
    <MeetingContext.Provider value={{
      pastMeetings, upcomingMeetings, selectedSummary, isLoading,
      trashedMeetings,
      fetchMeetingSummaries, fetchUpcoming, viewSummary,
      createMeeting, scheduleMeeting, cancelMeeting,
      trashMeeting, restoreMeeting, permanentlyDeleteMeeting, emptyTrash,
    }}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => useContext(MeetingContext);