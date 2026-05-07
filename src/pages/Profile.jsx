import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { auth } from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Profile() {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(userProfile?.username || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: username });
      await updateDoc(doc(db, 'users', user.uid), { username });
      setUserProfile({ ...userProfile, username });
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Rooms Created', value: userProfile?.roomsCreated || 0, icon: '🏠' },
    { label: 'Rooms Joined', value: userProfile?.roomsJoined || 0, icon: '🚪' },
    { label: 'Upload Total', value: userProfile?.totalUploadBytes ? `${(userProfile.totalUploadBytes / 1024 / 1024).toFixed(1)} MB` : '0 MB', icon: '☁️' },
    { label: 'Account Type', value: userProfile?.plan?.toUpperCase() || 'FREE', icon: '💳' },
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '40px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Profile</h1>
        </div>

        {/* Avatar & Info */}
        <motion.div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            width: '96px', height: '96px', borderRadius: '20px', overflow: 'hidden',
            border: '2px solid var(--border-purple)', position: 'relative'
          }}>
            <img src={userProfile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid}`}
              alt="avatar" style={{ width: '100%', height: '100%' }} />
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="input" value={username} onChange={e => setUsername(e.target.value)} style={{ textAlign: 'center' }} />
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {userProfile?.username || user?.displayName || 'Ghost User'}
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏️</button>
              </div>
              <div className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
                {userProfile?.isGuest ? 'Guest Account' : user?.email}
              </div>
            </div>
          )}

          <span className={`badge badge-${userProfile?.plan === 'pro' ? 'purple' : userProfile?.plan === 'business' ? 'cyan' : 'green'}`}>
            {userProfile?.plan?.toUpperCase() || 'FREE'} PLAN
          </span>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {stats.map(s => (
            <motion.div key={s.label} className="glass-card" style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span style={{ fontSize: '28px' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Space Grotesk' }}>{s.value}</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Upgrade CTA */}
        {(!userProfile?.plan || userProfile?.plan === 'free') && (
          <div className="glass-card" style={{
            padding: '24px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), transparent)',
            borderColor: 'rgba(124,58,237,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
          }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>⚡ Upgrade to Pro</div>
              <div className="text-muted" style={{ fontSize: '13px' }}>10GB files, unlimited rooms, longer expiry</div>
            </div>
            <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade →</Link>
          </div>
        )}

        {/* Danger Zone */}
        <div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ghost-red)', marginBottom: '12px' }}>⚠️ Danger Zone</h3>
          <p className="text-muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
            Deleting your account will permanently remove all your rooms, files, and data.
          </p>
          <button className="btn btn-danger btn-sm" onClick={() => toast.error('Account deletion requires email confirmation. Contact support.')}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
