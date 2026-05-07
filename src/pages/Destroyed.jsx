import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Destroyed() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '24px', padding: '40px 16px', position: 'relative', zIndex: 1, textAlign: 'center'
    }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        style={{ fontSize: '80px' }}
      >
        💀
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}
      >
        <h1 style={{ fontSize: '40px', fontWeight: 900 }}>Room Destroyed</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '400px', lineHeight: '1.7' }}>
          This room has been permanently destroyed. All messages, files, and data have been wiped from our servers.{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Zero trace remains.</strong>
        </p>

        <div className="glass-card" style={{
          padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start'
        }}>
          {[
            '✅ All messages deleted',
            '✅ All files purged from storage',
            '✅ Room metadata cleared',
            '✅ QR codes disabled',
            '✅ Invite links invalidated',
            '✅ Participant data removed',
          ].map(item => (
            <div key={item} style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/create" className="btn btn-primary btn-lg">
            💣 Create New Room
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            ← Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
