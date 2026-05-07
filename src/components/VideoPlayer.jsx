import React, { useState } from 'react';

// Detect video type from URL
function getVideoType(url) {
  if (!url) return null;
  if (url.startsWith('data:video/')) return 'direct';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'direct';
  return null;
}

function getYouTubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function VideoPlayer({ url, title }) {
  const [error, setError] = useState(false);
  const type = getVideoType(url);

  if (!type || error) return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--ghost-cyan-light)', fontSize: '13px', wordBreak: 'break-all' }}>
      🎬 {title || url}
    </a>
  );

  const wrapStyle = {
    width: '100%', maxWidth: '400px', borderRadius: '12px',
    overflow: 'hidden', background: '#000', marginTop: '8px'
  };

  if (type === 'youtube') {
    const id = getYouTubeId(url);
    return (
      <div style={wrapStyle}>
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=0&rel=0`}
          style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video'}
        />
      </div>
    );
  }

  if (type === 'vimeo') {
    const id = getVimeoId(url);
    return (
      <div style={wrapStyle}>
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title || 'Video'}
        />
      </div>
    );
  }

  // Direct MP4/WebM/OGG
  return (
    <div style={wrapStyle}>
      <video
        controls
        style={{ width: '100%', maxHeight: '300px', display: 'block' }}
        onError={() => setError(true)}
        preload="metadata"
      >
        <source src={url} />
        Your browser does not support video playback.
      </video>
      <div style={{ padding: '6px 10px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'flex', justifyContent: 'space-between' }}>
        <span>🎬 {title || 'Video'}</span>
        <a href={url} download style={{ color: 'var(--ghost-cyan-light)' }}>⬇️ Download</a>
      </div>
    </div>
  );
}
