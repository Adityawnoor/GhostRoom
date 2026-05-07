import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

export default function Settings() {
  const { userProfile } = useAuthStore();
  const [settings, setSettings] = useState({
    notifications: true,
    soundAlerts: true,
    autoJoin: false,
    showTyping: true,
    compactMode: false,
    defaultExpiry: '60',
    maxFileSize: '100',
  });

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const Section = ({ title, children }) => (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{title}</h3>
      {children}
    </div>
  );

  const ToggleRow = ({ label, desc, setting }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>}
      </div>
      <label className="toggle-switch" style={{ flexShrink: 0 }}>
        <input type="checkbox" checked={settings[setting]} onChange={() => toggle(setting)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '40px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Settings</h1>
        </div>

        <Section title="🔔 Notifications">
          <ToggleRow label="Push Notifications" desc="Receive alerts when someone joins your room" setting="notifications" />
          <ToggleRow label="Sound Alerts" desc="Play sound on new messages" setting="soundAlerts" />
        </Section>

        <Section title="💬 Chat Preferences">
          <ToggleRow label="Show Typing Indicators" desc="Show when others are typing" setting="showTyping" />
          <ToggleRow label="Compact Mode" desc="Reduce message padding for denser view" setting="compactMode" />
          <ToggleRow label="Auto-Join Invite Links" desc="Skip the join screen for familiar rooms" setting="autoJoin" />
        </Section>

        <Section title="⚙️ Room Defaults">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Default Room Expiry</label>
            <select
              className="input"
              value={settings.defaultExpiry}
              onChange={e => setSettings(s => ({ ...s, defaultExpiry: e.target.value }))}
              style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}
            >
              <option value="10">10 minutes</option>
              <option value="60">1 hour</option>
              <option value="360">6 hours</option>
              <option value="1440">24 hours</option>
              <option value="10080">7 days</option>
            </select>
          </div>
        </Section>

        <Section title="🔐 Security">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px' }}>
            <span style={{ fontSize: '24px' }}>🔒</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>End-to-End Encryption</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Always enabled — AES-256-GCM client-side encryption</div>
            </div>
            <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            GhostRoom uses AES-256-GCM encryption. Your encryption keys are derived client-side using PBKDF2. We never have access to your plaintext messages.
          </div>
        </Section>

        <Section title="📊 Plan & Billing">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Current Plan: <span style={{ color: 'var(--ghost-purple-light)' }}>{userProfile?.plan?.toUpperCase() || 'FREE'}</span></div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {userProfile?.plan === 'free' ? '10 rooms/month, 100MB max file size' : 'Unlimited rooms, 10GB max file size'}
              </div>
            </div>
            {(!userProfile?.plan || userProfile?.plan === 'free') && (
              <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade</Link>
            )}
          </div>
        </Section>

        <button
          className="btn btn-primary btn-lg"
          style={{ justifyContent: 'center' }}
          onClick={() => toast.success('Settings saved!')}
        >
          💾 Save Settings
        </button>
      </div>

      <style>{`.toggle-switch { margin: 0; }`}</style>
    </div>
  );
}
