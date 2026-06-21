import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store';
import './Landing.css';

/* ── Data ── */
const FEATURES = [
  { icon: '🔐', title: 'End-to-End Encrypted', desc: 'AES-256 encryption. Only room members can read your messages.' },
  { icon: '💣', title: 'Self-Destructing Rooms', desc: 'Rooms auto-delete after expiry. All messages and files are permanently purged.' },
  { icon: '📁', title: '10GB File Sharing', desc: 'Chunked resumable uploads with live progress. Works on mobile too.' },
  { icon: '⚡', title: 'Real-Time Chat', desc: 'Instant messaging with typing indicators and presence detection.' },
  { icon: '📱', title: 'QR Code Join', desc: 'Share rooms via QR code, invite link, or room ID. Mobile-first.' },
  { icon: '🕵️', title: 'Ghost Mode', desc: 'Join as anonymous guest. No account, no trace, no strings attached.' },
];

const PRICING = [
  {
    name: 'Free', price: '$0', period: 'forever',
    features: ['10 rooms/month', '100MB file uploads', '24hr max room expiry', 'Up to 10 participants', 'Basic encryption', 'QR code sharing'],
    cta: 'Get Started Free', highlight: false,
  },
  {
    name: 'Pro', price: '$12', period: '/month',
    features: ['Unlimited rooms', '10GB file uploads', '30-day max expiry', 'Up to 100 participants', 'Priority support', 'Advanced analytics', 'Custom room names', 'File streaming'],
    cta: 'Start Pro Trial', highlight: true,
  },
  {
    name: 'Business', price: '$49', period: '/month',
    features: ['Everything in Pro', 'Team rooms & workspaces', 'Admin dashboard', 'SSO & compliance', 'SLA guarantee', 'API access', 'Dedicated support'],
    cta: 'Contact Sales', highlight: false,
  },
];

const TESTIMONIALS = [
  { name: 'Arjun S.', role: 'Security Researcher', avatar: 'arjun', text: '"GhostRoom is the only platform I trust for sensitive drops. Zero-trace self-destruct is exactly what the security community needs."' },
  { name: 'Priya M.', role: 'Startup Founder', avatar: 'priya', text: '"Password-protected rooms and auto-expiry give us peace of mind that legacy email never could."' },
  { name: 'Marcus T.', role: 'Journalist', avatar: 'marcus', text: '"Ghost Mode + disappearing rooms lets me receive documents without leaving any metadata trail. Indispensable."' },
  { name: 'Lena K.', role: 'Product Designer', avatar: 'lena', text: '"The UI is genuinely stunning. But what keeps me coming back is how effortlessly it handles large design files."' },
  { name: 'Daniel R.', role: 'CTO at DevFlow', avatar: 'daniel', text: '"Spun up a secure war room for incident response in 30 seconds. QR join, encrypted chat, then self-destructed. Perfect."' },
  { name: 'Sana A.', role: 'Legal Consultant', avatar: 'sana', text: '"GhostRoom replaced our insecure email threads overnight. The 30-day expiry Pro option is exactly what we needed."' },
];

const FAQS = [
  { q: 'Is GhostRoom truly anonymous?', a: 'Yes. You can join as a guest with zero account creation. Anonymous sessions are temporary and never linked to identity.' },
  { q: 'What happens when a room expires?', a: 'All messages, files, metadata, and participant records are permanently deleted from all servers. Nothing remains.' },
  { q: 'How large can uploaded files be?', a: 'Free users can upload up to 100MB. Pro users get 10GB per file with chunked resumable uploads that survive connection drops.' },
  { q: 'Is my data really encrypted?', a: 'Messages are encrypted client-side using AES-256-GCM before reaching our servers. We store only ciphertext — we cannot read your messages.' },
  { q: 'Can I use GhostRoom on mobile?', a: 'Absolutely. GhostRoom is a PWA with full mobile support, offline capabilities, and touch-optimized drag & drop file uploads.' },
  { q: 'Can I pause and resume large uploads?', a: 'Yes. The chunked upload engine supports pause, resume, and cancel for any file. If your connection drops, simply resume from where you left off.' },
];

/* ── Mock self-destruct room data with live countdown ── */
const MOCK_ROOMS = [
  { id: 'XKCD89', name: 'Project Alpha Drop', members: 4, files: 12, msgs: 47, totalSecs: 1440 * 60, remainSecs: 23 * 60 + 41, status: 'live' },
  { id: 'GH4K2M', name: 'Investor Deck Share', members: 2, files: 3,  msgs: 18, totalSecs: 3600,      remainSecs: 8 * 60 + 12,  status: 'live' },
  { id: 'RT9PLX', name: 'Legal Review Room',   members: 6, files: 28, msgs: 93, totalSecs: 3600,      remainSecs: 4 * 60 + 55,  status: 'expiring' },
  { id: 'ZQ7WNS', name: 'Incident Response',   members: 8, files: 5,  msgs: 134,totalSecs: 7200,      remainSecs: 2 * 60 + 10,  status: 'expiring' },
  { id: 'MP3CVT', name: 'Whistleblower Drop',  members: 1, files: 7,  msgs: 5,  totalSecs: 1800,      remainSecs: 45,            status: 'critical' },
  { id: 'BK8FJY', name: 'Source Interview',    members: 3, files: 2,  msgs: 62, totalSecs: 86400,     remainSecs: 59 * 60 + 58, status: 'live' },
];

/* ── CountUp — IntersectionObserver-triggered ── */
const CountUp = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    const steps = 60; let current = 0;
    const inc = target / steps;
    const iv = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(iv); }
      else setCount(current);
    }, 1200 / steps);
    return () => clearInterval(iv);
  }, [started, target]);
  return <span ref={ref}>{Math.round(count).toLocaleString()}{suffix}</span>;
};

/* ── Format seconds → MM:SS or HH:MM:SS ── */
const fmt = (s) => {
  if (s <= 0) return '00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

/* ── LiveRoomCard — ticking countdown, progress bar ── */
const LiveRoomCard = ({ room }) => {
  const [secs, setSecs] = useState(room.remainSecs);
  useEffect(() => {
    const iv = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  const pct = Math.max(0, (secs / room.totalSecs) * 100);
  const isCritical = room.status === 'critical' || secs < 120;
  const isExpiring = room.status === 'expiring' || (secs < 600 && !isCritical);
  const statusLabel = isCritical ? 'CRITICAL' : isExpiring ? 'EXPIRING' : 'LIVE';
  const statusClass = isCritical ? 'sdroom-status-critical' : isExpiring ? 'sdroom-status-expiring' : 'sdroom-status-live';

  return (
    <div className={`sdroom-card ${isCritical ? 'sdroom-card-critical' : isExpiring ? 'sdroom-card-expiring' : ''}`}>
      <div className="sdroom-top">
        <div className="sdroom-info">
          <div className="sdroom-name">{room.name}</div>
          <div className="sdroom-id">#{room.id}</div>
        </div>
        <div className={`sdroom-status ${statusClass}`}>
          <span className="sdroom-dot" />
          {statusLabel}
        </div>
      </div>
      {/* Countdown timer */}
      <div className={`sdroom-timer ${isCritical ? 'sdroom-timer-critical' : ''}`}>
        {secs === 0 ? '💀 DESTROYED' : fmt(secs)}
      </div>
      {/* Depletion bar */}
      <div className="sdroom-bar-track">
        <div
          className={`sdroom-bar-fill ${isCritical ? 'sdroom-bar-critical' : isExpiring ? 'sdroom-bar-expiring' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Meta row */}
      <div className="sdroom-meta">
        <span>👥 {room.members}</span>
        <span>💬 {room.msgs}</span>
        <span>📁 {room.files}</span>
      </div>
    </div>
  );
};

export default function Landing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (roomId.trim()) navigate(`/join/${roomId.trim().toUpperCase()}`);
  };

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="nav-inner" style={{ padding: '0 40px', maxWidth: '100%' }}>
          <Link to="/" className="landing-logo" onClick={() => setMenuOpen(false)}>
            <span className="logo-icon">👻</span>
            <span className="logo-text">GhostRoom</span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            <a href="#rooms" className="nav-link">Live Rooms</a>
            <a href="#features" className="nav-link">Features</a>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          {/* Desktop CTA */}
          <div className="nav-cta">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: '18px', padding: '12px 24px' }}>Dashboard</Link>
            ) : (
              <>
                <Link to="/auth" className="btn btn-ghost" style={{ fontSize: '18px', padding: '12px 24px' }}>Sign In</Link>
                <Link to="/auth?tab=signup" className="btn btn-primary" style={{ fontSize: '18px', padding: '12px 24px' }}>Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
            <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
            <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="nav-mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <a href="#rooms"    className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Live Rooms</a>
              <a href="#features" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
              <Link to="/pricing" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <a href="#faq"      className="mobile-nav-link" onClick={() => setMenuOpen(false)}>FAQ</a>
              <div className="mobile-nav-actions">
                {user ? (
                  <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                ) : (
                  <>
                    <Link to="/auth" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
                    <Link to="/auth?tab=signup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Get Started</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero-section">
        <div className="hero-grid-bg" />
        <div className="container hero-content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="hero-announce">
              <span className="hero-announce-tag">New</span>
              10GB file sharing + AES-256 encryption now live →
            </div>
          </motion.div>

          <motion.h1 className="hero-title" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            The World's Most Secure<br />
            Temporary Chat, File &amp;<br />
            <span className="gradient-word" style={{ whiteSpace: 'nowrap' }}>Self-Destructive Rooms</span>
          </motion.h1>

          <motion.p className="hero-sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
            Create encrypted, password-protected rooms. Share files up to 10GB.
            Chat in real time. Self-destruct when done. <strong>No trace remains.</strong>
          </motion.p>

          <motion.div className="hero-cta-row" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}>
            <Link to="/create" className="btn btn-primary btn-xl hero-cta-shimmer" style={{ fontSize: '24px', padding: '18px 36px' }}>
              Create a Room →
            </Link>
            <form className="hero-join-form" onSubmit={handleQuickJoin}>
              <input
                className="input hero-join-input"
                placeholder="ROOM ID..."
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                maxLength={8}
              />
              <button type="submit" className="btn btn-secondary btn-lg" style={{ fontSize: '24px', padding: '18px 36px' }}>Join →</button>
            </form>
          </motion.div>

          <motion.div className="hero-stats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            {[
              { label: 'Rooms Destroyed', value: 284712, suffix: '+' },
              { label: 'Files Shared',    value: 1420000, suffix: '+' },
              { label: 'Uptime',          value: 99.9,   suffix: '%' },
              { label: 'Countries',       value: 142,    suffix: '' },
            ].map(stat => (
              <div key={stat.label} className="stat-item">
                <div className="stat-value"><CountUp target={stat.value} suffix={stat.suffix} /></div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Chat preview */}
        <motion.div className="hero-preview" initial={{ opacity: 0, y: 60, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, delay: 0.4 }}>
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-dots">
                <span style={{ background: '#ff5f57' }} />
                <span style={{ background: '#febc2e' }} />
                <span style={{ background: '#28c840' }} />
              </div>
              <div className="preview-room-info">
                <span>👻 Room: XKCD89</span>
                <span style={{ background: 'rgba(68,255,136,0.15)', color: '#44ff88', border: '1px solid rgba(68,255,136,0.3)', borderRadius: '99px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>● LIVE</span>
              </div>
              <div className="preview-timer">⏱ 23:41 left</div>
            </div>
            <div className="preview-messages">
              <div className="preview-msg self">Hey! Got those files 🔐</div>
              <div className="preview-msg other">Uploading 3 files now... (2.4 GB)</div>
              <div className="preview-msg self">Room auto-destructs in 23 min 👻</div>
              <div className="preview-typing">
                <span>Alex is typing</span>
                <span className="preview-typing-cursor" />
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── LIVE SELF-DESTRUCT ROOMS ─── */}
      <section className="section sdrooms-section" id="rooms">
        <div className="container">
          <div className="section-header">
            <div className="sdrooms-live-badge">
              <span className="live-dot" />
              LIVE ROOMS
            </div>
            <h2>Self-Destructing In Real Time</h2>
            <p className="text-muted section-sub">Watch rooms count down to zero — then vanish forever. Every second is real.</p>
          </div>

          <div className="sdrooms-grid">
            {MOCK_ROOMS.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <LiveRoomCard room={room} />
              </motion.div>
            ))}
          </div>

          <div className="sdrooms-cta">
            <p className="text-muted">These are simulated rooms for demo purposes. Your real rooms are fully encrypted.</p>
            <Link to="/create" className="btn btn-primary">Create Your Room →</Link>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Built for Privacy. Engineered for Scale.</h2>
            <hr className="section-divider" />
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} className="feature-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc text-muted">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Three Steps to Total Privacy</h2>
            <hr className="section-divider" />
          </div>
          <div className="steps-row">
            {[
              { n: '01', icon: '🏠', title: 'Create a Room', desc: 'Set a password, choose expiry (10min to 30 days), get an instant invite link + QR code.' },
              { n: '02', icon: '👥', title: 'Invite & Collaborate', desc: 'Share the link, QR code, or room ID. Chat in real time and share massive files instantly.' },
              { n: '03', icon: '💣', title: 'Room Self-Destructs', desc: 'Timer hits zero. All data, files, messages, and traces are permanently purged. Zero trace remains.' },
            ].map((step, i) => (
              <motion.div key={step.n} className="step-card" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="step-number">{step.n}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p className="text-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Trusted by Thousands</h2>
            <hr className="section-divider" />
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} className="testimonial-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}&backgroundColor=111111`} alt={t.name} className="testimonial-avatar" />
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role text-muted">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <hr className="section-divider" />
          </div>
          <div className="pricing-grid">
            {PRICING.map((plan) => (
              <motion.div key={plan.name} className={`pricing-card ${plan.highlight ? 'pricing-highlight' : ''}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                {plan.highlight && <div className="pricing-badge">Most Popular</div>}
                <div className="pricing-header">
                  <div className="pricing-name">{plan.name}</div>
                  <div className="pricing-price">{plan.price}<span className="pricing-period">{plan.period}</span></div>
                </div>
                <ul className="pricing-features">
                  {plan.features.map(f => (
                    <li key={f}><span>✓</span> {f}</li>
                  ))}
                </ul>
                <Link to={user ? '/dashboard' : '/auth'} className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} btn-lg`} style={{ width: '100%', justifyContent: 'center' }}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="section" id="faq">
        <div className="container" style={{ maxWidth: '720px' }}>
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <hr className="section-divider" />
          </div>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'faq-open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
                </div>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div className="faq-answer text-muted" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="landing-logo">
                <span className="logo-icon">👻</span>
                <span className="logo-text">GhostRoom</span>
              </div>
              <p className="text-muted footer-tagline">Secure. Temporary. Zero Trace.</p>
            </div>
            <div className="footer-links">
              {[
                { label: 'Product', links: [{ l: 'Live Rooms', h: '#rooms' }, { l: 'Features', h: '#features' }, { l: 'Pricing', h: '/pricing' }, { l: 'Security', h: '#' }] },
                { label: 'Company', links: [{ l: 'About', h: '#' }, { l: 'Blog', h: '#' }, { l: 'Careers', h: '#' }, { l: 'Contact', h: '#' }] },
                { label: 'Legal', links: [{ l: 'Privacy', h: '#' }, { l: 'Terms', h: '#' }, { l: 'Cookies', h: '#' }] },
              ].map(col => (
                <div key={col.label} className="footer-col">
                  <h4 className="footer-col-title">{col.label}</h4>
                  <ul>{col.links.map(link => (<li key={link.l}><a href={link.h} className="footer-link">{link.l}</a></li>))}</ul>
                </div>
              ))}
            </div>
          </div>
          <div className="footer-bottom">
            <p className="text-muted">© 2025 GhostRoom. Built with 👻 by privacy advocates.</p>
            <div className="footer-social">
              <a href="#" className="btn btn-ghost btn-sm">Twitter</a>
              <a href="#" className="btn btn-ghost btn-sm">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
