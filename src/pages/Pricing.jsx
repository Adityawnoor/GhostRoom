import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

const PLANS = [
  {
    name: 'Free', price: 0, period: 'forever', color: '#475569', icon: '🌱',
    features: ['10 rooms/month', '100MB per file', '24hr max expiry', '10 participants', 'AES encryption', 'QR join'],
    missing: ['10GB uploads', 'Longer expiry', 'Advanced analytics', 'Priority support'],
    cta: 'Current Plan', current: true,
  },
  {
    name: 'Pro', price: 12, period: '/month', color: '#7c3aed', icon: '⚡',
    features: ['Unlimited rooms', '10GB per file', '30-day expiry', '100 participants', 'Advanced analytics', 'Custom room names', 'File streaming', 'Priority support'],
    missing: ['Team rooms', 'SSO', 'API access'],
    cta: 'Upgrade to Pro', popular: true,
  },
  {
    name: 'Business', price: 49, period: '/month', color: '#06b6d4', icon: '🏢',
    features: ['Everything in Pro', 'Team workspaces', 'Admin dashboard', 'SSO & SAML', 'API access', 'SLA guarantee', 'Custom retention', 'Dedicated support', 'Audit logs', 'Compliance exports'],
    cta: 'Contact Sales',
  },
];

export default function Pricing() {
  const { user } = useAuthStore();
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '0 0 80px' }}>
      {/* Nav */}
      <nav style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>👻</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '20px', background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GhostRoom</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          {user ? <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
            : <Link to="/auth" className="btn btn-primary btn-sm">Get Started</Link>}
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '1100px', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '16px', display: 'inline-flex' }}>💳 Pricing</span>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: '16px' }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted" style={{ fontSize: '16px', maxWidth: '480px', margin: '0 auto 32px' }}>
            Start for free. Upgrade when you need more power. Cancel anytime.
          </p>

          {/* Annual toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', color: annual ? 'var(--text-muted)' : 'var(--text-primary)' }}>Monthly</span>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input type="checkbox" checked={annual} onChange={e => setAnnual(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
            <span style={{ fontSize: '14px', color: annual ? 'var(--text-primary)' : 'var(--text-muted)' }}>Annual</span>
            {annual && <span className="badge badge-green" style={{ fontSize: '11px' }}>Save 20%</span>}
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              className="glass-card"
              style={{
                padding: '32px',
                position: 'relative',
                ...(plan.popular ? {
                  borderColor: 'rgba(124,58,237,0.5)',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(15,15,26,0.9))',
                  boxShadow: 'var(--shadow-purple)',
                  transform: 'scale(1.04)',
                } : {})
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                  fontSize: '12px', fontWeight: 700, padding: '4px 16px', borderRadius: '9999px'
                }}>Most Popular</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '32px' }}>{plan.icon}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: plan.color }}>{plan.name}</div>
                  <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'Space Grotesk', lineHeight: 1 }}>
                    ${annual && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price}
                    <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--text-secondary)' }}>{plan.period}</span>
                  </div>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: plan.color, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
                {plan.missing?.map(f => (
                  <li key={f} style={{ fontSize: '14px', display: 'flex', gap: '10px', alignItems: 'center', opacity: 0.4 }}>
                    <span style={{ fontWeight: 700 }}>✗</span> {f}
                  </li>
                ))}
              </ul>

              <Link
                to={user ? '/dashboard' : '/auth'}
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '80px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>All Plans Include</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '32px' }}>
            {['🔐 AES-256 Encryption', '💣 Auto-Destruct', '📱 Mobile PWA', '🌐 Global CDN', '🔗 QR Code Sharing', '🕵️ Guest Mode'].map(f => (
              <div key={f} className="glass" style={{ padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
