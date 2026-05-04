import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMeeting } from '../context/MeetingContext';
import SummaryDashboard from '../components/Dashboard/SummaryDashboard';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  User,
  Video,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const [meetingId, setMeetingId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [hiddenMeetingIds, setHiddenMeetingIds] = useState(new Set());
  const [recentCleared, setRecentCleared] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    pastMeetings,
    selectedSummary,
    fetchMeetingSummaries,
    upcomingMeetings,
    scheduleMeeting,
    cancelMeeting,
    createMeeting,
    viewSummary,
    isLoading,
    trashedMeetings,
    trashMeeting,
    restoreMeeting,
    permanentlyDeleteMeeting,
    emptyTrash,
  } = useMeeting();

  useEffect(() => {
    fetchMeetingSummaries();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const matchesMeeting = (meeting) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      meeting.id,
      meeting.title,
      meeting.date,
      meeting.duration,
      meeting.executiveSummary,
      meeting.scheduledAt,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  };

  const filteredPastMeetings = pastMeetings
    .filter(matchesMeeting)
    .filter((m) => !hiddenMeetingIds.has(m.id));
  const filteredUpcomingMeetings = upcomingMeetings.filter(matchesMeeting);
  const nextMeeting = useMemo(() => {
    return [...upcomingMeetings].sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''))[0];
  }, [upcomingMeetings]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const recapsWithSummaries = pastMeetings.filter((meeting) => meeting.executiveSummary).length;
  const actionItemCount = pastMeetings.reduce((total, meeting) => total + (meeting.actionItems?.length || 0), 0);

  const handleCreateMeeting = async () => {
    const result = await createMeeting('Instant Meeting', user?.id || 'anonymous');
    navigate(`/meeting/${result?.id || Math.random().toString(36).substring(2, 9)}`);
  };

  const handleJoinMeeting = (event) => {
    event.preventDefault();
    if (meetingId.trim()) navigate(`/meeting/${meetingId.trim()}`);
  };

  const handleCancelMeeting = (id) => {
    const confirmed = window.confirm('Cancel this scheduled meeting?');
    if (confirmed) cancelMeeting(id);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = () => currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="dashboard-shell">
      <nav className="dashboard-topbar">
        <button className="dashboard-brand" type="button" onClick={() => navigate('/dashboard')}>
          <span><Brain className="w-5 h-5" /></span>
          <strong>SyncMind</strong>
        </button>

        <div className="dashboard-search">
          <Search className="w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search meetings, summaries, IDs..."
          />
          {searchQuery.trim() && (
            <button type="button" onClick={() => setSearchQuery('')} title="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="dashboard-nav-actions">
          <button type="button" className="dashboard-icon-button" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="dashboard-icon-button"
            title={`Recycle Bin${trashedMeetings.length ? ` (${trashedMeetings.length})` : ''}`}
            onClick={() => setShowRecycleBin(true)}
            style={{ position: 'relative' }}
          >
            <Trash2 className="w-4 h-4" />
            {trashedMeetings.length > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: '#ef4444', color: 'white',
                borderRadius: '50%', width: '16px', height: '16px',
                fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {trashedMeetings.length}
              </span>
            )}
          </button>
          <button type="button" className="dashboard-icon-button" onClick={() => navigate('/settings')} title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <button type="button" className="dashboard-profile-button" onClick={() => navigate('/profile')}>
            <span>{user?.name?.charAt(0) || 'U'}</span>
            <div>
              <strong>{user?.name || 'User'}</strong>
              <small>{user?.role || 'host'}</small>
            </div>
          </button>
          <button type="button" className="dashboard-icon-button danger" onClick={handleLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <section className="dashboard-hero-row">
          <div>
            <p className="dashboard-date"><Calendar className="w-4 h-4" /> {formatDate()}</p>
            <h1>Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}</h1>
            <p>Run a meeting, join by ID, or review what the AI has already captured.</p>
          </div>
          <div className="dashboard-hero-actions">
            <button type="button" className="dashboard-secondary-button" onClick={() => setShowScheduleModal(true)}>
              <Calendar className="w-4 h-4" /> Schedule
            </button>
            <button type="button" className="dashboard-primary-button" onClick={handleCreateMeeting}>
              <Plus className="w-4 h-4" /> New Meeting
            </button>
          </div>
        </section>

        <section className="dashboard-stat-grid" aria-label="Meeting overview">
          <MetricCard icon={Calendar} label="Upcoming" value={upcomingMeetings.length} tone="blue" />
          <MetricCard icon={FileText} label="Recent recaps" value={recapsWithSummaries} tone="green" />
          <MetricCard icon={Check} label="Open action items" value={actionItemCount} tone="orange" />
          <MetricCard icon={Activity} label="Total meetings" value={pastMeetings.length + upcomingMeetings.length} tone="indigo" />
        </section>

        <section className="dashboard-layout">
          <div className="dashboard-left-column">
            <section className="dashboard-command-panel">
              <div className="dashboard-panel-heading">
                <span><Video className="w-4 h-4" /></span>
                <div>
                  <h2>Start or join</h2>
                  <p>Keep the primary meeting actions within reach.</p>
                </div>
              </div>
              <button type="button" className="dashboard-start-card" onClick={handleCreateMeeting}>
                <span><Video className="w-5 h-5" /></span>
                <div>
                  <strong>Start instant meeting</strong>
                  <small>Create a room and invite your team.</small>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              <form className="dashboard-join-form" onSubmit={handleJoinMeeting}>
                <input
                  type="text"
                  placeholder="Paste or enter meeting ID"
                  value={meetingId}
                  onChange={(event) => setMeetingId(event.target.value)}
                />
                <button type="submit" disabled={!meetingId.trim()}>
                  <LogIn className="w-4 h-4" /> Join
                </button>
              </form>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-title">
                <div>
                  <h2>Up next</h2>
                  <p>{nextMeeting ? 'Your next scheduled room' : 'No scheduled meetings yet'}</p>
                </div>
                <button type="button" onClick={() => setShowScheduleModal(true)}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <UpcomingList
                meetings={filteredUpcomingMeetings}
                searchQuery={searchQuery}
                onJoin={(id) => navigate(`/meeting/${id}`)}
                onCancel={handleCancelMeeting}
              />
            </section>
          </div>

          <div className="dashboard-center-column">
            <section className="dashboard-panel">
              <div className="dashboard-panel-title dashboard-panel-title-row">
                <div>
                  <h2>Recent meetings</h2>
                  <p>{isLoading ? 'Loading recaps...' : `${filteredPastMeetings.length} visible`}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {searchQuery.trim() && <span className="dashboard-search-count">Filtered</span>}
                  {!recentCleared && pastMeetings.length > 0 && (
                    <button
                      type="button"
                      className="dashboard-danger-button"
                      title="Move all to recycle bin"
                      onClick={() => {
                        pastMeetings.forEach(m => trashMeeting(m.id));
                        setRecentCleared(false);
                      }}
                    >
                      <Trash2 className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>
              </div>
              <RecentMeetingList
                meetings={filteredPastMeetings}
                searchQuery={searchQuery}
                isLoading={isLoading}
                onSelect={viewSummary}
                onTrash={trashMeeting}
              />
            </section>
          </div>

          <aside className="dashboard-right-column">
            <section className="dashboard-ai-panel">
              <div className="dashboard-panel-heading">
                <span><Sparkles className="w-4 h-4" /></span>
                <div>
                  <h2>AI recap</h2>
                  <p>{selectedSummary ? 'Selected meeting details' : 'Select a recent meeting'}</p>
                </div>
              </div>
              {selectedSummary ? (
                <SummaryDashboard meetingData={selectedSummary} />
              ) : (
                <div className="dashboard-empty-recap">
                  <FileText className="w-7 h-7" />
                  <strong>No recap selected</strong>
                  <p>Open a recent meeting to review its summary, decisions, and action items.</p>
                </div>
              )}
            </section>
          </aside>
        </section>
      </main>

      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={(title, dateTime) => scheduleMeeting(title, dateTime, user?.id)}
        />
      )}
      {showRecycleBin && (
        <RecycleBinModal
          trashedMeetings={trashedMeetings}
          onRestore={restoreMeeting}
          onDelete={permanentlyDeleteMeeting}
          onEmptyAll={emptyTrash}
          onClose={() => setShowRecycleBin(false)}
        />
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <article className={`dashboard-metric-card tone-${tone}`}>
      <span><Icon className="w-4 h-4" /></span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}

function RecentMeetingList({ meetings, searchQuery, isLoading, onSelect, onTrash }) {
  if (isLoading) {
    return (
      <div className="dashboard-list-skeleton">
        {[1, 2, 3].map((item) => <span key={item} />)}
      </div>
    );
  }

  if (!meetings.length) {
    return (
      <EmptyState
        icon={FileText}
        title={searchQuery.trim() ? 'No matching recaps' : 'No recent meetings'}
        body={searchQuery.trim() ? 'Try another meeting title, ID, or summary keyword.' : 'Start or join a meeting to build your recap library.'}
      />
    );
  }

  return (
    <div className="dashboard-recent-list">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="dashboard-recent-row" style={{ display: 'flex', alignItems: 'center' }}>
          <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0' }} onClick={() => onSelect(meeting.id)}>
            <span className="dashboard-row-icon"><FileText className="w-4 h-4" /></span>
            <div className="dashboard-row-main">
              <strong>{meeting.title || 'Untitled meeting'}</strong>
              <p>{meeting.executiveSummary || 'Summary will appear after the meeting is finalized.'}</p>
              <div className="dashboard-row-meta">
                {meeting.date && (
                  <span><Calendar className="w-3 h-3" /> {meeting.date}</span>
                )}
                {meeting.duration && (
                  <span><Clock className="w-3 h-3" /> {meeting.duration}</span>
                )}
                {meeting.executiveSummary ? (
                  <span className="dashboard-row-badge has-summary"><Sparkles className="w-3 h-3" /> AI Summary</span>
                ) : (
                  <span className="dashboard-row-badge pending"><Clock className="w-3 h-3" /> Pending</span>
                )}
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4" style={{ flexShrink: 0, color: '#9ca3af' }} />
          </button>
          <button
            type="button"
            className="dashboard-row-trash-btn"
            title="Move to recycle bin"
            onClick={(e) => { e.stopPropagation(); onTrash(meeting.id); }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function UpcomingList({ meetings, searchQuery, onJoin, onCancel }) {
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isJoinable = (isoString) => {
    const meetingTime = new Date(isoString).getTime();
    return Date.now() >= meetingTime - 5 * 60 * 1000;
  };

  if (!meetings.length) {
    return (
      <EmptyState
        icon={Calendar}
        title={searchQuery.trim() ? 'No matching upcoming meetings' : 'Schedule is clear'}
        body={searchQuery.trim() ? 'Try a different title or meeting ID.' : 'Schedule a meeting when you need the team ready later.'}
      />
    );
  }

  return (
    <div className="dashboard-upcoming-list">
      {meetings.map((meeting) => (
        <article key={meeting.id} className="dashboard-upcoming-row">
          <div>
            <strong>{meeting.title || 'Scheduled meeting'}</strong>
            <span><Clock className="w-3.5 h-3.5" /> {formatTime(meeting.scheduledAt)}</span>
          </div>
          <div>
            <button type="button" className="dashboard-mini-button primary" onClick={() => onJoin(meeting.id)} disabled={!isJoinable(meeting.scheduledAt)}>
              Join
            </button>
            <button type="button" className="dashboard-mini-button" onClick={() => onCancel(meeting.id)}>
              Cancel
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="dashboard-empty-state">
      <Icon className="w-6 h-6" />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function ScheduleModal({ onClose, onSchedule }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [scheduled, setScheduled] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('10:00');
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!date || !time) return;

    setIsSubmitting(true);
    setError('');

    try {
      const result = await onSchedule(title || 'Scheduled Meeting', `${date}T${time}:00`);
      if (!result || !result.id) {
        setError('Failed to schedule meeting. Please try again.');
        setIsSubmitting(false);
        return;
      }
      setScheduled(result);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!scheduled) return;
    await navigator.clipboard.writeText(`${window.location.origin}/meeting/${scheduled.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const modalContent = (
    <div className="dashboard-modal-backdrop" onClick={onClose}>
      <div className="dashboard-schedule-modal" onClick={(event) => event.stopPropagation()}>
        {!scheduled ? (
          <>
            <div className="dashboard-modal-header">
              <div>
                <h2>Schedule meeting</h2>
                <p>Create a room for later.</p>
              </div>
              <button type="button" onClick={onClose}><X className="w-4 h-4" /></button>
            </div>
            {error && (
              <div className="dashboard-schedule-error">
                <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="dashboard-schedule-form">
              <label>
                Meeting title
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sprint planning" />
              </label>
              <div>
                <label>
                  Date
                  <input type="date" value={date} onChange={(event) => setDate(event.target.value)} min={new Date().toISOString().split('T')[0]} required />
                </label>
                <label>
                  Time
                  <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
                </label>
              </div>
              <div className="dashboard-modal-actions">
                <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="dashboard-schedule-loading">Scheduling...</span>
                  ) : (
                    'Schedule'
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="dashboard-scheduled-success">
            <span><Check className="w-7 h-7" /></span>
            <h2>Meeting scheduled</h2>
            <p>{scheduled.title} - {new Date(scheduled.scheduledAt).toLocaleString()}</p>
            <button type="button" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy invite link'}
            </button>
            <button type="button" className="dashboard-done-button" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function RecycleBinModal({ trashedMeetings, onRestore, onDelete, onEmptyAll, onClose }) {
  const modalContent = (
    <div className="dashboard-modal-backdrop" onClick={onClose}>
      <div className="dashboard-schedule-modal" style={{ maxWidth: '600px', width: '100%' }} onClick={(event) => event.stopPropagation()}>
        <div className="dashboard-modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 className="w-5 h-5" style={{ color: '#ef4444' }} />
              Recycle Bin
            </h2>
            <p>Deleted meetings will stay here until permanently removed.</p>
          </div>
          <button type="button" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        {trashedMeetings.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              type="button"
              className="dashboard-danger-button"
              onClick={() => {
                if (window.confirm('Permanently delete all meetings in the recycle bin? This cannot be undone.')) {
                  onEmptyAll();
                }
              }}
            >
              Empty Recycle Bin
            </button>
          </div>
        )}

        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trashedMeetings.length === 0 ? (
            <div className="dashboard-empty-state" style={{ padding: '40px 20px', background: '#f9fafb', borderRadius: '8px' }}>
              <RotateCcw className="w-8 h-8" style={{ color: '#d1d5db', marginBottom: '12px' }} />
              <strong style={{ color: '#6b7280' }}>Recycle bin is empty</strong>
            </div>
          ) : (
            trashedMeetings.map(meeting => (
              <div key={meeting.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText className="w-4 h-4" style={{ color: '#9ca3af' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#374151' }}>{meeting.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Deleted: {new Date(meeting.trashedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="dashboard-action-button"
                    title="Restore meeting"
                    onClick={() => onRestore(meeting.id)}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="dashboard-danger-button"
                    title="Permanently delete"
                    onClick={() => {
                      if (window.confirm('Permanently delete this meeting? This cannot be undone.')) {
                        onDelete(meeting.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
