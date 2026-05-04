import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Brain, LogOut, Mic, MonitorUp,
  RefreshCw, Save, SlidersHorizontal, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  meetingReminders: true,
  summaryReady: true,
  soundEffects: true,
  joinMuted: false,
  joinVideoOff: false,
  autoTranscription: true,
  preferredCameraId: '',
  preferredMicrophoneId: '',
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const storedSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...(user?.preferences?.settings || {}) }),
    [user?.preferences?.settings]
  );
  const [settings, setSettings] = useState(storedSettings);
  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [saveState, setSaveState] = useState({ type: '', message: '' });
  const [deviceState, setDeviceState] = useState('');

  useEffect(() => {
    setSettings(storedSettings);
  }, [storedSettings]);

  const loadDevices = async (requestAccess = false) => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDeviceState('This browser does not support device selection.');
      return;
    }

    let permissionStream = null;
    try {
      if (requestAccess) {
        permissionStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const nextCameras = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({ id: device.deviceId, label: device.label || `Camera ${index + 1}` }));
      const nextMicrophones = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({ id: device.deviceId, label: device.label || `Microphone ${index + 1}` }));

      setCameras(nextCameras);
      setMicrophones(nextMicrophones);
      setDeviceState(nextCameras.length || nextMicrophones.length ? '' : 'No camera or microphone detected.');
    } catch {
      setDeviceState('Allow camera and microphone access to manage device preferences.');
    } finally {
      if (permissionStream) {
        permissionStream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  useEffect(() => {
    loadDevices(false);
  }, []);

  const handleSave = async () => {
    const result = await updateProfile({
      name: user?.name || '',
      preferences: {
        ...(user?.preferences || {}),
        settings
      }
    });

    if (result?.error) {
      setSaveState({ type: 'error', message: result.error });
      return;
    }

    setSaveState({ type: 'success', message: 'Settings updated.' });
    setTimeout(() => setSaveState({ type: '', message: '' }), 2500);
  };

  const setToggle = (key) => setSettings((current) => ({ ...current, [key]: !current[key] }));

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
          <button type="button" className="dashboard-icon-button" onClick={() => navigate('/profile')} title="Profile">
            <User className="w-4 h-4" />
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
          <h1>Settings</h1>
          <p>Control notifications, meeting defaults, and device behavior for future calls.</p>
        </div>

        <div className="inner-page-grid">
          {/* Notifications */}
          <div className="inner-page-panel">
            <h2><Bell className="w-5 h-5" /> Notifications</h2>
            <div className="inner-page-form-grid">
              <SettingToggle label="Email notifications" description="Receive account and meeting emails." checked={settings.emailNotifications} onChange={() => setToggle('emailNotifications')} />
              <SettingToggle label="Meeting reminders" description="Get reminders before scheduled meetings start." checked={settings.meetingReminders} onChange={() => setToggle('meetingReminders')} />
              <SettingToggle label="Summary ready alerts" description="Notify when meeting summaries are prepared." checked={settings.summaryReady} onChange={() => setToggle('summaryReady')} />
              <SettingToggle label="Interface sound effects" description="Play small UI sounds for actions and alerts." checked={settings.soundEffects} onChange={() => setToggle('soundEffects')} />
            </div>
          </div>

          {/* Meeting Defaults */}
          <div className="inner-page-panel">
            <h2><SlidersHorizontal className="w-5 h-5" /> Meeting Defaults</h2>
            <div className="inner-page-form-grid">
              <SettingToggle label="Join muted" description="Start meetings with your microphone muted in pre-join." checked={settings.joinMuted} onChange={() => setToggle('joinMuted')} />
              <SettingToggle label="Join with camera off" description="Start meetings with your camera disabled in pre-join." checked={settings.joinVideoOff} onChange={() => setToggle('joinVideoOff')} />
              <SettingToggle label="Live transcription enabled" description="Keep local Whisper transcription turned on during meetings." checked={settings.autoTranscription} onChange={() => setToggle('autoTranscription')} />
              <SettingToggle label="Echo cancellation" description="Reduce feedback from speakers and room echo." checked={settings.echoCancellation} onChange={() => setToggle('echoCancellation')} />
              <SettingToggle label="Noise suppression" description="Reduce background sounds from fans and room noise." checked={settings.noiseSuppression} onChange={() => setToggle('noiseSuppression')} />
              <SettingToggle label="Automatic gain control" description="Balance microphone volume automatically." checked={settings.autoGainControl} onChange={() => setToggle('autoGainControl')} />
            </div>
          </div>

          {/* Devices */}
          <div className="inner-page-panel">
            <div className="inner-page-device-bar">
              <h2><MonitorUp className="w-5 h-5" /> Devices</h2>
              <button type="button" onClick={() => loadDevices(true)} className="inner-page-ghost-button">
                <RefreshCw className="w-4 h-4" /> Refresh Devices
              </button>
            </div>

            <div className="inner-page-form-grid">
              <label className="inner-page-label">
                Preferred Camera
                <select value={settings.preferredCameraId} onChange={(event) => setSettings((current) => ({ ...current, preferredCameraId: event.target.value }))} className="input-field">
                  <option value="">System default camera</option>
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>{camera.label}</option>
                  ))}
                </select>
              </label>

              <label className="inner-page-label">
                <span className="label-row"><Mic className="w-4 h-4" /> Preferred Microphone</span>
                <select value={settings.preferredMicrophoneId} onChange={(event) => setSettings((current) => ({ ...current, preferredMicrophoneId: event.target.value }))} className="input-field">
                  <option value="">System default microphone</option>
                  {microphones.map((microphone) => (
                    <option key={microphone.id} value={microphone.id}>{microphone.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {deviceState && <p className="inner-page-device-warning">{deviceState}</p>}
          </div>

          {/* Save actions */}
          <div className="inner-page-actions">
            {saveState.message && (
              <span className={`inner-page-status ${saveState.type}`}>{saveState.message}</span>
            )}
            <button type="button" onClick={handleSave} className="inner-page-save-button">
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <label className="inner-page-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <div>
        <p className="inner-page-toggle-label">{label}</p>
        <p className="inner-page-toggle-desc">{description}</p>
      </div>
    </label>
  );
}
