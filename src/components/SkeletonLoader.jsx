import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
  animate: { backgroundPosition: ['200% 0', '-200% 0'] },
  transition: { duration: 1.5, repeat: Infinity, ease: 'linear' }
};

const skeletonStyle = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
  backgroundSize: '400% 100%',
  borderRadius: '8px',
};

export const SkeletonBlock = ({ width = '100%', height = '16px', style = {} }) => (
  <motion.div {...shimmer} style={{ width, height, ...skeletonStyle, ...style }} />
);

export const SkeletonDashboard = () => (
  <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    {/* Stats row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonBlock width="40px" height="40px" style={{ borderRadius: '10px' }} />
          <SkeletonBlock width="60px" height="28px" />
          <SkeletonBlock width="80px" height="12px" />
        </div>
      ))}
    </div>
    {/* Room cards */}
    <SkeletonBlock height="24px" width="160px" />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonBlock width="80%" height="18px" />
          <SkeletonBlock width="50%" height="12px" />
          <SkeletonBlock height="6px" style={{ borderRadius: '99px' }} />
          <SkeletonBlock width="120px" height="32px" style={{ borderRadius: '8px' }} />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonRoom = () => (
  <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
    {/* Header */}
    <div style={{ height: '64px', background: 'var(--bg-glass)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-glass)' }}>
      <SkeletonBlock width="32px" height="32px" style={{ borderRadius: '8px' }} />
      <SkeletonBlock width="120px" height="20px" />
      <div style={{ flex: 1 }} />
      <SkeletonBlock width="200px" height="32px" />
      {[...Array(3)].map((_, i) => <SkeletonBlock key={i} width="36px" height="36px" style={{ borderRadius: '8px' }} />)}
    </div>
    {/* Body */}
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '12px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', flexDirection: i % 2 === 0 ? 'row' : 'row-reverse' }}>
            <SkeletonBlock width="36px" height="36px" style={{ borderRadius: '50%', flexShrink: 0 }} />
            <SkeletonBlock width={`${120 + (i * 30) % 100}px`} height="44px" style={{ borderRadius: '12px' }} />
          </div>
        ))}
      </div>
      <div style={{ width: '300px', background: 'var(--bg-glass)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border-glass)' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <SkeletonBlock width="40px" height="40px" style={{ borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBlock width="70%" height="14px" />
              <SkeletonBlock width="40%" height="10px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonAuth = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '40px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-glass)' }}>
      <SkeletonBlock width="60px" height="60px" style={{ borderRadius: '50%', alignSelf: 'center' }} />
      <SkeletonBlock width="50%" height="28px" style={{ alignSelf: 'center' }} />
      <SkeletonBlock height="48px" style={{ borderRadius: '10px' }} />
      <SkeletonBlock height="48px" style={{ borderRadius: '10px' }} />
      <SkeletonBlock height="48px" style={{ borderRadius: '10px' }} />
      <SkeletonBlock height="48px" style={{ borderRadius: '10px', background: 'rgba(124,58,237,0.3)' }} />
    </div>
  </div>
);

export default { SkeletonBlock, SkeletonDashboard, SkeletonRoom, SkeletonAuth };
