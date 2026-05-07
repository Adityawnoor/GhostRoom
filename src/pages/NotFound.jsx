import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '24px', padding: '40px', zIndex: 1, position: 'relative',
      textAlign: 'center'
    }}>
      <motion.div
        style={{ fontSize: '80px' }}
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >👻</motion.div>
      <h1 style={{ fontSize: '80px', fontWeight: 900, lineHeight: 1, background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>This page doesn't exist. It may have been destroyed.</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
        <Link to="/dashboard" className="btn btn-secondary btn-lg">Dashboard</Link>
      </div>
    </div>
  );
}
