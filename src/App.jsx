import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthChange } from './firebase/auth';
import { getUserProfile } from './firebase/auth';
import { useAuthStore } from './store';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Room from './pages/Room';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Destroyed from './pages/Destroyed';
import NotFound from './pages/NotFound';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const PageLoader = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', flexDirection: 'column', gap: '20px'
  }}>
    <div style={{
      width: 60, height: 60,
      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      borderRadius: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'pulse-glow 2s ease-in-out infinite',
      fontSize: '28px',
    }}>👻</div>
    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading GhostRoom...</div>
  </div>
);

export default function App() {
  const { setUser, setUserProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Safety timeout — never hang on loader more than 6 seconds
    const timeout = setTimeout(() => setLoading(false), 6000);

    const unsubscribe = onAuthChange(async (user) => {
      clearTimeout(timeout);
      setUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (e) {
          // Firestore not set up yet — continue without profile
          console.warn('Could not load user profile:', e.message);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="bg-orbs">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/destroyed" element={<Destroyed />} />
        <Route path="/join/:roomId" element={<JoinRoom />} />

        {/* Auth Routes */}
        <Route path="/auth" element={
          <PublicRoute><Auth /></PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute><CreateRoom /></ProtectedRoute>
        } />
        <Route path="/room/:roomId" element={
          <ProtectedRoute><Room /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 15, 26, 0.95)',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
        }}
      />
    </BrowserRouter>
  );
}
