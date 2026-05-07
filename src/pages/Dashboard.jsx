import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { getUserRooms } from '../firebase/firestore';
import { logOut } from '../firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import './Dashboard.css';

/**
 * CountUpDash — Animates a number from 0 → target on page load.
 * Used for stat cards in dashboard.
 */
const CountUpDash = ({ target }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number') return;
    const duration = 1000;
    const steps = 50;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);
  return <>{Math.round(count)}</>;
};

/**
 * RoomCard — with 3D tilt on mouse move using perspective + rotateX/Y.
 */
const RoomCard = ({ room }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const expired = room.expiresAt?.toDate() < new Date();
  const destroyed = room.status === 'destroyed';

  const statusColor = destroyed ? 'var(--ghost-red)' : expired ? 'var(--text-muted)' : 'var(--ghost-green)';
  const statusText = destroyed ? '💀 Destroyed' : expired ? '⏰ Expired' : '🟢 Active';

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) card.style.transform = '';
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className="room-card glass-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => !destroyed && !expired && navigate(`/room/${room.id}`)}
      style={{ cursor: !destroyed && !expired ? 'pointer' : 'default' }}
    >
      <div className="room-card-header">
        <div>
          <div className="room-card-name">{room.name}</div>
          <div className="room-card-id">ID: {room.id}</div>
        </div>
        <div className="room-card-status" style={{ color: statusColor }}>{statusText}</div>
      </div>
      <div className="room-card-meta">
        <span>👥 {room.participantCount || 1} members</span>
        <span>💬 {room.messageCount || 0} messages</span>
        <span>📁 {room.fileCount || 0} files</span>
      </div>
      {!destroyed && !expired && (
        <div className="room-card-expiry">
          ⏱️ Expires {formatDistanceToNow(room.expiresAt?.toDate?.() || new Date(), { addSuffix: true })}
        </div>
      )}
      {room.hasPassword && (
        <div className="room-card-badge"><span className="badge badge-purple">🔐 Password Protected</span></div>
      )}
    </motion.div>
  );
};

export default function Dashboard() {
  const { user, userProfile } = useAuthStore();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    getUserRooms(user.uid).then(r => {
      setRooms(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleLogout = async () => {
    await logOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const filteredRooms = rooms.filter(r => {
    const expired = r.expiresAt?.toDate() < new Date();
    const destroyed = r.status === 'destroyed';
    if (filter === 'active') return !destroyed && !expired;
    if (filter === 'expired') return expired || destroyed;
    return true;
  });

  const activeCount = rooms.filter(r => !r.expiresAt || r.expiresAt.toDate() > new Date() && r.status !== 'destroyed').length;
  const totalMessages = rooms.reduce((a, r) => a + (r.messageCount || 0), 0);

  return (
    <div className="dashboard-page">
      {/* ─── Sidebar ─── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <span style={{ fontSize: '40px' }}>👻</span>
            <span style={{
              fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '32px',
              background: 'var(--grad-text)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>GhostRoom</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {[
            { icon: '🏠', label: 'Dashboard', path: '/dashboard', active: true },
            { icon: '➕', label: 'Create Room', path: '/create' },
            { icon: '🚪', label: 'Join Room', path: '/join' },
            { icon: '👤', label: 'Profile', path: '/profile' },
            { icon: '⚙️', label: 'Settings', path: '/settings' },
            { icon: '💳', label: 'Upgrade', path: '/pricing' },
          ].map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${item.active ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <img
              src={userProfile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid}`}
              alt="avatar"
            />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userProfile?.username || user?.displayName || 'Ghost User'}</div>
            <div className="sidebar-user-plan">
              <span className={`badge badge-${userProfile?.plan === 'pro' ? 'purple' : userProfile?.plan === 'business' ? 'cyan' : 'green'}`} style={{ fontSize: '11px', padding: '3px 8px', marginTop: '4px' }}>
                {userProfile?.plan?.toUpperCase() || 'FREE'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: '20px', padding: '8px' }} data-tooltip="Sign Out">🚪</button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="dashboard-main">
        {/* Header with gradient separator below */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Welcome back, <span className="text-gradient">{userProfile?.username?.split('_')[0] || 'Ghost'}</span> 👻
            </h1>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/join" className="btn btn-secondary" style={{ fontSize: '20px', padding: '16px 28px' }}>🚪 Join Room</Link>
            <Link to="/create" className="btn btn-primary" style={{ fontSize: '20px', padding: '16px 28px' }}>➕ Create Room</Link>
          </div>
        </div>

        {/* Stats Cards with count-up + trend indicators */}
        <div className="stats-grid">
          {[
            { label: 'Total Rooms', value: rooms.length, icon: '🏠', color: '#7c3aed', trend: 'up', trendVal: '+12%' },
            { label: 'Active Rooms', value: activeCount, icon: '🟢', color: '#10b981', trend: 'up', trendVal: '+5%' },
            { label: 'Messages Sent', value: totalMessages, icon: '💬', color: '#06b6d4', trend: 'up', trendVal: '+23%' },
            { label: 'Plan', value: userProfile?.plan?.toUpperCase() || 'FREE', icon: '💳', color: '#f97316', isText: true },
          ].map(stat => (
            <motion.div
              key={stat.label}
              className="stat-card glass-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="stat-card-icon" style={{ background: `${stat.color}22` }}>{stat.icon}</div>
              <div>
                <div className="stat-card-value" style={stat.isText ? { color: stat.color } : {}}>
                  {stat.isText ? stat.value : <CountUpDash target={stat.value} />}
                  {/* Trend indicator */}
                  {stat.trend && (
                    <span className={`stat-trend ${stat.trend}`}>
                      {stat.trend === 'up' ? '↑' : '↓'} {stat.trendVal}
                    </span>
                  )}
                </div>
                <div className="stat-card-label">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions with hover left-border accent */}
        <div className="quick-actions">
          <div className="quick-action-card glass-card" onClick={() => navigate('/create')} style={{ cursor: 'pointer' }}>
            <div className="quick-action-icon" style={{ background: 'rgba(124,58,237,0.2)' }}>💣</div>
            <div>
              <div className="quick-action-title">Create New Room</div>
              <div className="quick-action-desc text-muted">Start a secure, encrypted session</div>
            </div>
            <span className="quick-action-arrow">→</span>
          </div>
          <div className="quick-action-card glass-card" onClick={() => navigate('/join')} style={{ cursor: 'pointer' }}>
            <div className="quick-action-icon" style={{ background: 'rgba(6,182,212,0.2)' }}>🚪</div>
            <div>
              <div className="quick-action-title">Join a Room</div>
              <div className="quick-action-desc text-muted">Enter with ID, password, or QR</div>
            </div>
            <span className="quick-action-arrow">→</span>
          </div>
          <div className="quick-action-card glass-card" onClick={() => navigate('/pricing')} style={{ cursor: 'pointer' }}>
            <div className="quick-action-icon" style={{ background: 'rgba(249,115,22,0.2)' }}>⚡</div>
            <div>
              <div className="quick-action-title">Upgrade to Pro</div>
              <div className="quick-action-desc text-muted">10GB files, unlimited rooms</div>
            </div>
            <span className="quick-action-arrow">→</span>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="rooms-section">
          <div className="rooms-header">
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Your Rooms</h2>
            <div className="room-filters">
              {['all', 'active', 'expired'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <SkeletonDashboard />
          ) : filteredRooms.length === 0 ? (
            <div className="empty-state glass-card">
              {/* Animated 80px ghost that bobs up/down */}
              <span className="empty-ghost-icon">👻</span>
              <h3>No Rooms Yet</h3>
              <p className="text-muted">Create your first secure room to get started</p>
              <Link to="/create" className="btn btn-primary btn-pulse-ring" style={{ marginTop: '16px' }}>
                ➕ Create First Room
              </Link>
            </div>
          ) : (
            <div className="rooms-grid">
              {filteredRooms.map(room => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
