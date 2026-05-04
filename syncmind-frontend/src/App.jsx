import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import LiveMeetingPage from './pages/LiveMeetingPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MeetingProvider } from './context/MeetingContext';

// Protected route wrapper — redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

// Public route — redirects to dashboard if already logged in
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('route-fade-enter');

  useEffect(() => {
    const nextLocation = `${location.pathname}${location.search}${location.hash}`;
    const currentLocation = `${displayLocation.pathname}${displayLocation.search}${displayLocation.hash}`;
    if (nextLocation === currentLocation) return undefined;

    setTransitionStage('route-fade-exit');
    const timeout = setTimeout(() => {
      setDisplayLocation(location);
      setTransitionStage('route-fade-enter');
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 170);

    return () => clearTimeout(timeout);
  }, [location, displayLocation]);

  return (
    <div className={`route-transition-shell ${transitionStage}`}>
      <Routes location={displayLocation}>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/meeting/:roomId" element={<ProtectedRoute><LiveMeetingPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MeetingProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatedRoutes />
        </Router>
      </MeetingProvider>
    </AuthProvider>
  );
}
