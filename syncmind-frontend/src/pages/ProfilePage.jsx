import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Brain, Globe, KeyRound, LogOut, Mail, MapPin,
  Save, Settings, Shield, User
} from 'lucide-react';

const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Marathi',
  'Spanish',
  'French'
];

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const profilePrefs = user?.preferences?.profile || {};
  const timeZoneOptions = useMemo(() => {
    const currentZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return Array.from(new Set([
      currentZone,
      'UTC',
      'Asia/Kolkata',
      'Europe/London',
      'America/New_York',
      'America/Los_Angeles'
    ]));
  }, []);

  const [name, setName] = useState(user?.name || '');
  const [jobTitle, setJobTitle] = useState(profilePrefs.jobTitle || '');
  const [location, setLocation] = useState(profilePrefs.location || '');
  const [language, setLanguage] = useState(profilePrefs.language || 'English');
  const [timeZone, setTimeZone] = useState(profilePrefs.timeZone || timeZoneOptions[0] || 'UTC');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveState, setSaveState] = useState({ type: '', message: '' });
  const [passwordState, setPasswordState] = useState({ type: '', message: '' });

  useEffect(() => {
    setName(user?.name || '');
    setJobTitle(profilePrefs.jobTitle || '');
    setLocation(profilePrefs.location || '');
    setLanguage(profilePrefs.language || 'English');
    setTimeZone(profilePrefs.timeZone || timeZoneOptions[0] || 'UTC');
  }, [user?.name, profilePrefs.jobTitle, profilePrefs.location, profilePrefs.language, profilePrefs.timeZone, timeZoneOptions]);

  const handleProfileSave = async () => {
    const result = await updateProfile({
      name: name.trim(),
      preferences: {
        ...(user?.preferences || {}),
        profile: {
          jobTitle: jobTitle.trim(),
          location: location.trim(),
          language,
          timeZone
        }
      }
    });

    if (result?.error) {
      setSaveState({ type: 'error', message: result.error });
      return;
    }

    setSaveState({ type: 'success', message: 'Profile updated.' });
    setTimeout(() => setSaveState({ type: '', message: '' }), 2500);
  };

  const handlePasswordSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordState({ type: 'error', message: 'Fill in all password fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordState({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (result?.error) {
      setPasswordState({ type: 'error', message: result.error });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordState({ type: 'success', message: 'Password changed.' });
    setTimeout(() => setPasswordState({ type: '', message: '' }), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      {/* Unified top bar — same as Dashboard */}
      <nav className="dashboard-topbar">
        <button className="dashboard-brand" type="button" onClick={() => navigate('/dashboard')}>
          <span><Brain className="w-5 h-5" /></span>
          <strong>SyncMind</strong>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            className="dashboard-icon-button"
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
            style={{ width: 'auto', padding: '0 14px', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#007AFF' }}
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
        </div>

        <div className="dashboard-nav-actions">
          <button type="button" className="dashboard-icon-button" title="Notifications">
            <Bell className="w-4 h-4" />
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

      <div className="inner-page-content">
        <div className="inner-page-header">
          <h1>Profile</h1>
          <p>Manage the identity and security details other participants see for your account.</p>
        </div>

        <div className="inner-page-grid-sidebar">
          {/* Sidebar — avatar card */}
          <div className="inner-page-avatar-card">
            <div className="inner-page-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h2>{user?.name}</h2>
            <div className="inner-page-avatar-meta">
              <Shield className="w-4 h-4" />
              Role: <span className="accent">{user?.role || 'participant'}</span>
            </div>
            <div className="inner-page-avatar-meta">
              <Mail className="w-4 h-4" />
              {user?.email}
            </div>
            <div className="inner-page-avatar-divider">
              <p>Member since</p>
              <p>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Recently'}
              </p>
            </div>
          </div>

          {/* Main content */}
          <div className="inner-page-grid">
            {/* Personal Info */}
            <div className="inner-page-panel">
              <h2><User className="w-5 h-5" /> Personal Info</h2>
              <div className="inner-page-form-grid">
                <label className="inner-page-label full-width">
                  <span className="label-row"><User className="w-4 h-4" /> Full Name</span>
                  <input type="text" value={name} onChange={(event) => setName(event.target.value)} className="input-field" />
                </label>

                <label className="inner-page-label">
                  Job Title
                  <input type="text" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className="input-field" placeholder="e.g. Project Lead" />
                </label>

                <label className="inner-page-label">
                  <span className="label-row"><MapPin className="w-4 h-4" /> Location</span>
                  <input type="text" value={location} onChange={(event) => setLocation(event.target.value)} className="input-field" placeholder="e.g. Pune, India" />
                </label>

                <label className="inner-page-label">
                  Language
                  <select value={language} onChange={(event) => setLanguage(event.target.value)} className="input-field">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="inner-page-label">
                  <span className="label-row"><Globe className="w-4 h-4" /> Time Zone</span>
                  <select value={timeZone} onChange={(event) => setTimeZone(event.target.value)} className="input-field">
                    {timeZoneOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="inner-page-label full-width">
                  <span className="label-row"><Mail className="w-4 h-4" /> Email</span>
                  <input type="email" value={user?.email || ''} readOnly className="input-field" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </label>
              </div>

              <div className="inner-page-actions">
                {saveState.message && (
                  <span className={`inner-page-status ${saveState.type}`}>{saveState.message}</span>
                )}
                <button type="button" onClick={handleProfileSave} className="inner-page-save-button">
                  <Save className="w-4 h-4" /> Save Profile
                </button>
              </div>
            </div>

            {/* Security */}
            <div className="inner-page-panel">
              <h2><KeyRound className="w-5 h-5" /> Security</h2>
              <div className="inner-page-form-grid">
                <label className="inner-page-label">
                  <span className="label-row"><KeyRound className="w-4 h-4" /> Current Password</span>
                  <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="input-field" />
                </label>
                <label className="inner-page-label">
                  New Password
                  <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="input-field" />
                </label>
                <label className="inner-page-label">
                  Confirm New Password
                  <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-field" />
                </label>
              </div>

              <div className="inner-page-actions">
                {passwordState.message && (
                  <span className={`inner-page-status ${passwordState.type}`}>{passwordState.message}</span>
                )}
                <button type="button" onClick={handlePasswordSave} className="inner-page-ghost-button">
                  <KeyRound className="w-4 h-4" /> Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
