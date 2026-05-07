import React, { useState } from 'react';

export default function PDFViewer({ url, fileName }) {
  const [useGoogle, setUseGoogle] = useState(false);

  // Try native embed first, fallback to Google Docs viewer
  const googleUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div style={{ width: '100%', maxWidth: '420px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-glass)' }}>
        <span style={{ fontSize: '12px', color: 'var(--ghost-purple-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📄 {fileName || 'Document'}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px' }}
            onClick={() => setUseGoogle(!useGoogle)}
          >
            {useGoogle ? 'Native' : 'Google View'}
          </button>
          <a href={url} download={fileName} className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }}>
            ⬇️
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }}>
            ↗️
          </a>
        </div>
      </div>
      {useGoogle ? (
        <iframe
          src={googleUrl}
          style={{ width: '100%', height: '400px', border: 'none', display: 'block' }}
          title={fileName}
        />
      ) : (
        <embed
          src={url}
          type="application/pdf"
          style={{ width: '100%', height: '400px', display: 'block' }}
          onError={() => setUseGoogle(true)}
        />
      )}
    </div>
  );
}
