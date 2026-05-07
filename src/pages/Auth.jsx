import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { signUp, signIn, signInAsGuest, signInWithGoogle } from '../firebase/auth';
import './Auth.css';

const tabs = ['login', 'signup'];

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'signup' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'signup') {
        if (!form.username.trim()) throw new Error('Username is required');
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match');
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters');
        await signUp(form.email, form.password, form.username);
        toast.success('Welcome to GhostRoom!');
      } else {
        await signIn(form.email, form.password);
        toast.success('Welcome back!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message.replace('Firebase: ', '').split('(')[0].trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await signInAsGuest();
      toast.success('Entered as Ghost 👻');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="auth-page">

      {/* ─── LEFT: Feature highlight panel ─── */}
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-logo">
            <span>👻</span>
            <span>GhostRoom</span>
          </Link>

          <div className="auth-tagline">
            <h2>Private by<br />design.</h2>
            <p className="text-muted">
              Create encrypted rooms, share files up to 10GB, and disappear without a trace.
            </p>
          </div>

          {/* Staggered monospace feature pills */}
          <div className="auth-features-mini">
            {[
              '// E2E_ENCRYPTED',
              '// SELF_DESTRUCTING',
              '// 10GB_FILE_SHARE',
              '// GHOST_MODE',
            ].map(f => (
              <div key={f} className="auth-feature-pill">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Auth card ─── */}
      <div className="auth-right">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Tab toggle */}
          <div className="auth-tabs">
            {tabs.map(t => (
              <button
                key={t}
                className={`auth-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
                type="button"
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="auth-form">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="auth-fields"
              >
                {tab === 'signup' && (
                  <div className="input-group">
                    <label className="input-label">Username</label>
                    <input
                      className="input"
                      name="username"
                      placeholder="ghost_user"
                      value={form.username}
                      onChange={handleChange}
                      required
                      autoComplete="username"
                    />
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input
                    className="input"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute', right: '14px', top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1,
                      }}
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                {tab === 'signup' && (
                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <input
                      className="input"
                      name="confirmPassword"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? <span className="animate-spin" style={{ fontSize: '14px' }}>⚙️</span> : null}
              {tab === 'login' ? 'Sign In to GhostRoom' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider"><span>or continue with</span></div>

          {/* OAuth */}
          <div className="auth-oauth">
            <button
              className="btn btn-secondary"
              onClick={handleGoogle}
              type="button"
            >
              <span style={{ fontSize: '14px' }}>G</span> Google
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleGuest}
              type="button"
              disabled={guestLoading}
            >
              {guestLoading
                ? <span className="animate-spin" style={{ fontSize: '12px' }}>⚙️</span>
                : <span>👻</span>}
              Ghost Mode
            </button>
          </div>

          <p className="auth-footer-note">
            By continuing, you agree to our{' '}
            <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
