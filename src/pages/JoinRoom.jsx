import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { getRoomById, joinRoom } from '../firebase/firestore';
import './JoinRoom.css';

export default function JoinRoom() {
  const { roomId: urlRoomId } = useParams();
  const { user, userProfile } = useAuthStore();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(urlRoomId || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [step, setStep] = useState(urlRoomId ? 'password' : 'id');

  useEffect(() => {
    if (urlRoomId) fetchRoomInfo(urlRoomId);
  }, [urlRoomId]);

  const fetchRoomInfo = async (id) => {
    setLookupLoading(true);
    try {
      const room = await getRoomById(id.toUpperCase());
      if (!room) { toast.error('Room not found'); setStep('id'); return; }
      if (room.status === 'destroyed') { navigate('/destroyed'); return; }
      if (room.expiresAt?.toDate() < new Date()) { navigate('/destroyed'); return; }
      setRoomInfo(room);
      setStep('password');
    } catch {
      toast.error('Room not found');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    fetchRoomInfo(roomId.trim());
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    setLoading(true);
    try {
      await joinRoom(
        roomInfo.id,
        roomInfo.hasPassword ? password : null,
        user.uid,
        userProfile?.username || user.displayName || 'Ghost'
      );
      toast.success('Joined room! 🚀');
      navigate(`/room/${roomInfo.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-page">
      <motion.div
        className="join-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="join-icon">🚪</div>
        <h1>Join a Room</h1>
        <p className="text-muted">Enter a room ID or scan a QR code to join securely</p>

        {step === 'id' ? (
          <form onSubmit={handleLookup} className="join-form">
            <div className="input-group">
              <label className="input-label">Room ID</label>
              <input
                className="input join-id-input"
                placeholder="e.g. XKCD89AB"
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                maxLength={8}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={lookupLoading || !roomId.trim()}
            >
              {lookupLoading ? <><span className="animate-spin">⚙️</span> Looking up...</> : 'Find Room →'}
            </button>

            <div className="join-divider">
              <span>No ID? Ask for an invite link or QR code</span>
            </div>

            <div className="join-back-link">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="join-form">
            {/* Room Info */}
            {roomInfo && (
              <motion.div
                className="room-info-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="room-info-header">
                  <div>
                    <div className="room-info-name">{roomInfo.name}</div>
                    <div className="room-info-id">ID: {roomInfo.id}</div>
                  </div>
                  <span className="badge badge-green">🟢 Active</span>
                </div>
                <div className="room-info-meta">
                  {roomInfo.hasPassword && <span className="badge badge-purple">🔐 Password Required</span>}
                  <span className="badge badge-cyan">👥 {roomInfo.participantCount || 0}/{roomInfo.maxParticipants}</span>
                  <span className="badge badge-orange">
                    ⏱️ {(() => {
                      const ms = roomInfo.expiresAt?.toDate() - new Date();
                      const mins = Math.floor(ms / 60000);
                      if (mins < 60) return `${mins}m left`;
                      if (mins < 1440) return `${Math.floor(mins/60)}h left`;
                      return `${Math.floor(mins/1440)}d left`;
                    })()}
                  </span>
                </div>
              </motion.div>
            )}

            {roomInfo?.hasPassword && (
              <div className="input-group">
                <label className="input-label">Room Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter room password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <><span className="animate-spin">⚙️</span> Joining...</> : '🚀 Join Room'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setStep('id'); setRoomInfo(null); setPassword(''); setRoomId(''); }}
            >
              ← Try Different Room
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
