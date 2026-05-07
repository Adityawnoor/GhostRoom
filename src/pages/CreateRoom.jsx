import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { createRoom } from '../firebase/firestore';
import './CreateRoom.css';

const EXPIRY_OPTIONS = [
  { label: '10 Min', value: 10, icon: '⚡' },
  { label: '1 Hour', value: 60, icon: '⏱️' },
  { label: '6 Hours', value: 360, icon: '🌅' },
  { label: '24 Hours', value: 1440, icon: '📅' },
  { label: '7 Days', value: 10080, icon: '📆' },
  { label: '30 Days', value: 43200, icon: '🗓️', pro: true },
];

const MAX_PARTICIPANTS = [5, 10, 25, 50, 100, 500];

export default function CreateRoom() {
  const { user, userProfile } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    expiryMinutes: 60,
    maxParticipants: 50,
    hasPassword: false,
  });
  const [showQR, setShowQR] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  // Live timer for preview
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.hasPassword && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.hasPassword && form.password.length < 4) {
      toast.error('Room password must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await createRoom(user.uid, {
        name: form.name || undefined,
        password: form.hasPassword ? form.password : null,
        expiryMinutes: form.expiryMinutes,
        maxParticipants: form.maxParticipants,
      });
      setCreatedRoom(result);
      toast.success('Room created successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdRoom.inviteLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedExpiry = EXPIRY_OPTIONS.find(o => o.value === form.expiryMinutes);

  if (createdRoom) {
    return (
      <div className="cr-success-page">
        <div className="cr-orb cr-orb-1" />
        <div className="cr-orb cr-orb-2" />
        
        <motion.div
          className="cr-success-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="cr-success-glow">✨</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 className="cr-success-title">Room Deployed</h1>
            <p className="cr-success-sub">Your encrypted, self-destructing workspace is live.</p>
          </div>

          <div className="cr-room-id-box">
            <span className="cr-room-id-label">Room ID</span>
            <span className="cr-room-id-value">{createdRoom.roomId}</span>
          </div>

          <div className="cr-link-row">
            <input className="cr-link-input" value={createdRoom.inviteLink} readOnly />
            <button className={`cr-copy-btn ${copied ? 'copied' : ''}`} onClick={copyLink}>
              {copied ? '✓ COPIED' : 'COPY LINK'}
            </button>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="cr-qr-btn" onClick={() => setShowQR(!showQR)}>
              {showQR ? 'Hide' : 'Show'} QR Code
            </button>
            <AnimatePresence>
              {showQR && (
                <motion.div
                  className="cr-qr-wrap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', justifyContent: 'center' }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdRoom.inviteLink)}&bgcolor=0a0a0a&color=ffffff&margin=10`}
                    alt="QR Code"
                    width={180}
                    style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="cr-success-actions">
            <button className="cr-action-primary" onClick={() => navigate(`/room/${createdRoom.roomId}`)}>
              Enter Room Now
            </button>
            <button className="cr-action-secondary" onClick={() => { 
              setCreatedRoom(null); 
              setForm({ name:'', password:'', confirmPassword:'', expiryMinutes:60, maxParticipants:50, hasPassword:false }); 
            }}>
              Create Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="cr-page">
      <div className="cr-orb cr-orb-1" />
      <div className="cr-orb cr-orb-2" />

      <div className="cr-layout">
        {/* LEFT PANEL - PREVIEW */}
        <div className="cr-preview">
          <span className="cr-preview-label">Live Preview</span>
          
          <motion.div 
            className="cr-preview-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cr-preview-top">
              <div className="cr-preview-badge">
                <div className="cr-preview-dot" /> LIVE
              </div>
              <div className="cr-preview-time">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            <div className="cr-preview-meta">
              <h2 className={`cr-preview-name ${!form.name ? 'cr-preview-name-placeholder' : ''}`}>
                {form.name || 'Unnamed Session'}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="cr-preview-row">
                <span className="cr-preview-row-key">Security</span>
                <span className="cr-preview-row-val" style={{ color: form.hasPassword ? '#44ff88' : 'rgba(255,255,255,0.5)' }}>
                  {form.hasPassword ? 'Password Protected' : 'Open Link'}
                </span>
              </div>
              <div className="cr-preview-row">
                <span className="cr-preview-row-key">Capacity</span>
                <span className="cr-preview-row-val">{form.maxParticipants} Users</span>
              </div>
            </div>

            <div className="cr-preview-expiry-bar">
              <div className="cr-preview-expiry-label">
                <span>Self-Destruct</span>
                <span className="cr-preview-row-val highlight">{selectedExpiry?.label}</span>
              </div>
              <div className="cr-preview-bar-track">
                <div className="cr-preview-bar-fill" style={{ width: '100%' }} />
              </div>
            </div>
          </motion.div>

          <div className="cr-info-cards">
            <div className="cr-info-card">
              <div className="cr-info-card-icon">🛡️</div>
              <div className="cr-info-card-text">
                <span className="cr-info-card-title">End-to-End Encrypted</span>
                <span className="cr-info-card-desc">Messages and files are encrypted. Only participants can view them.</span>
              </div>
            </div>
            <div className="cr-info-card">
              <div className="cr-info-card-icon">💥</div>
              <div className="cr-info-card-text">
                <span className="cr-info-card-title">Zero Trace</span>
                <span className="cr-info-card-desc">When the timer expires, all data is permanently wiped from our servers.</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <motion.div 
          className="cr-form-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="cr-back" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Dashboard
          </button>

          <div className="cr-header">
            <h1 className="cr-title">New Room</h1>
            <p className="cr-subtitle">Configure your secure environment parameters.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Identity */}
            <div className="cr-section">
              <div className="cr-section-head">
                <div className="cr-section-title">
                  <div className="cr-section-icon">🏷️</div>
                  Session Identity
                </div>
              </div>
              <div className="cr-input-wrap">
                <label className="cr-input-label">Room Name (Optional)</label>
                <input
                  className="cr-input"
                  placeholder="e.g. Project Phoenix, Strategy Sync..."
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>

            {/* Security */}
            <div className="cr-section">
              <div className="cr-section-head">
                <div className="cr-section-title">
                  <div className="cr-section-icon">🔐</div>
                  Access Control
                </div>
                <label className="cr-toggle">
                  <input type="checkbox" checked={form.hasPassword} onChange={e => handleChange('hasPassword', e.target.checked)} />
                  <div className="cr-toggle-track" />
                </label>
              </div>
              <AnimatePresence>
                {form.hasPassword && (
                  <motion.div 
                    className="cr-password-fields"
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: '16px' }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  >
                    <div className="cr-input-wrap">
                      <label className="cr-input-label">Access Password</label>
                      <input
                        className="cr-input"
                        type="password"
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={e => handleChange('password', e.target.value)}
                        required={form.hasPassword}
                      />
                    </div>
                    <div className="cr-input-wrap">
                      <label className="cr-input-label">Confirm Password</label>
                      <input
                        className="cr-input"
                        type="password"
                        placeholder="Verify your password"
                        value={form.confirmPassword}
                        onChange={e => handleChange('confirmPassword', e.target.value)}
                        required={form.hasPassword}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expiry */}
            <div className="cr-section">
              <div className="cr-section-head" style={{ marginBottom: '4px' }}>
                <div className="cr-section-title">
                  <div className="cr-section-icon">⏱️</div>
                  Self-Destruct Timer
                </div>
              </div>
              <div className="cr-expiry-grid">
                {EXPIRY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`cr-expiry-opt ${form.expiryMinutes === opt.value ? 'active' : ''} ${opt.pro && userProfile?.plan === 'free' ? 'locked' : ''}`}
                    onClick={() => {
                      if (opt.pro && userProfile?.plan === 'free') {
                        toast.error('Upgrade to Pro for extended lifetimes');
                      } else {
                        handleChange('expiryMinutes', opt.value);
                      }
                    }}
                  >
                    {opt.pro && <span className="cr-expiry-pro">PRO</span>}
                    <span className="cr-expiry-icon">{opt.icon}</span>
                    <span className="cr-expiry-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Participants */}
            <div className="cr-section">
              <div className="cr-section-head" style={{ marginBottom: '4px' }}>
                <div className="cr-section-title">
                  <div className="cr-section-icon">👥</div>
                  Capacity Limit
                </div>
              </div>
              <div className="cr-participants">
                {MAX_PARTICIPANTS.map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`cr-part-opt ${form.maxParticipants === n ? 'active' : ''}`}
                    onClick={() => handleChange('maxParticipants', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="cr-submit" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? (
                <><span className="cr-spin">⚙️</span> INITIALIZING...</>
              ) : (
                <><span className="cr-submit-icon">🚀</span> DEPLOY ROOM</>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
