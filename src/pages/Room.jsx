import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore, useRoomStore, useUIStore, useUploadStore } from '../store';
import {
  subscribeToRoom, subscribeToMessages, subscribeToParticipants,
  subscribeToUploads, sendMessage, setTyping, destroyRoom, leaveRoom,
  createUploadRecord
} from '../firebase/firestore';
import { uploadFileChunked } from '../firebase/storage';
import { generateRoomKey, encryptMessage, decryptMessage } from '../crypto/encryption';
import VideoPlayer from '../components/VideoPlayer';
import PDFViewer from '../components/PDFViewer';
import EmojiPickerPanel from '../components/EmojiPicker';
import { SkeletonRoom } from '../components/SkeletonLoader';
import './Room.css';

// ─── COUNTDOWN TIMER ────────────────────────────────────────
const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, expiresAt.toDate() - new Date());
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const hours = Math.floor(timeLeft / 3600000);
  const mins = Math.floor((timeLeft % 3600000) / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);

  const isUrgent = timeLeft < 300000; // < 5 minutes
  const isVeryUrgent = timeLeft < 60000; // < 1 minute

  return (
    <div className={`countdown ${isUrgent ? 'urgent' : ''} ${isVeryUrgent ? 'very-urgent' : ''}`}>
      <span className="countdown-label">⏱️ SELF-DESTRUCTS IN</span>
      <div className="countdown-time">
        {hours > 0 && <><span>{String(hours).padStart(2, '0')}</span><span className="countdown-sep">:</span></>}
        <span>{String(mins).padStart(2, '0')}</span>
        <span className="countdown-sep">:</span>
        <span>{String(secs).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

// ─── MESSAGE BUBBLE ──────────────────────────────────────────
const MessageBubble = ({ msg, isOwn, decryptedText }) => {
  const isSystem = msg.type === 'system';
  if (isSystem) return (
    <div className="system-message">{decryptedText || msg.encryptedContent}</div>
  );

  const renderContent = () => {
    const text = decryptedText || '';
    if (msg.type === 'video') {
      return <VideoPlayer url={text} title={msg.fileName} />;
    }
    if (msg.type === 'image') {
      return (
        <div>
          <img src={text} alt="shared" style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', display: 'block', cursor: 'pointer' }}
            onClick={() => window.open(text, '_blank')} />
        </div>
      );
    }
    if (msg.type === 'audio') {
      return <audio controls src={text} style={{ width: '100%', marginTop: '6px' }} />;
    }
    if (msg.type === 'pdf') {
      return <PDFViewer url={text} fileName={msg.fileName} />;
    }
    if (msg.type === 'file') {
      return (
        <div className="file-message">
          <span>📎</span>
          <a href={text} target="_blank" rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline', fontSize: '13px' }}>
            {msg.fileName || text}
          </a>
          {text && <a href={text} download className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }}>⬇️</a>}
        </div>
      );
    }
    return text || <span className="encrypted-badge">🔐 Encrypted</span>;
  };

  return (
    <motion.div
      className={`message-bubble-wrap ${isOwn ? 'own' : 'other'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isOwn && (
        <div className="message-avatar">
          <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${msg.senderId}`} alt={msg.senderName} />
        </div>
      )}
      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
        {!isOwn && <div className="message-sender">{msg.senderName}</div>}
        <div className="message-text">{renderContent()}</div>
        <div className="message-time">
          {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
          {isOwn && <span className="message-status">✓✓</span>}
        </div>
      </div>
    </motion.div>
  );
};

// ─── FILE ITEM ───────────────────────────────────────────────
const FileItem = ({ file }) => {
  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const isAudio = file.mimeType?.startsWith('audio/');
  const isPDF = file.mimeType === 'application/pdf';

  const getFileIcon = () => {
    if (isImage) return '🖼️';
    if (isVideo) return '🎬';
    if (isAudio) return '🎵';
    if (isPDF) return '📄';
    return '📁';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes/1024/1024).toFixed(1)} MB`;
    return `${(bytes/1024/1024/1024).toFixed(2)} GB`;
  };

  const progress = file.chunkCount > 0 ? (file.chunksUploaded / file.chunkCount) * 100 : 0;
  const isUploading = file.status === 'uploading';
  const isComplete = file.status === 'complete';

  return (
    <motion.div
      className="file-item"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="file-item-icon">{getFileIcon()}</div>
      <div className="file-item-info">
        <div className="file-item-name">{file.fileName}</div>
        <div className="file-item-meta">
          <span>{formatSize(file.fileSize)}</span>
          <span className={`badge badge-${isComplete ? 'green' : 'orange'}`} style={{ fontSize: '9px' }}>
            {isComplete ? '✓ Done' : isUploading ? '⬆️ Uploading' : file.status}
          </span>
        </div>
        {isUploading && (
          <div className="progress-track" style={{ marginTop: '6px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {isComplete && file.downloadURL && (
        <div className="file-item-actions">
          {(isImage || isVideo || isAudio) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => window.open(file.downloadURL, '_blank')}
              data-tooltip="Preview"
            >👁️</button>
          )}
          <a
            href={file.downloadURL}
            download={file.fileName}
            className="btn btn-ghost btn-sm"
            data-tooltip="Download"
          >⬇️</a>
        </div>
      )}
    </motion.div>
  );
};

// ─── VIDEO SHARE MODAL ───────────────────────────────────────
const VideoShareModal = ({ onClose, onShare }) => {
  const [url, setUrl] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onShare(url.trim());
    onClose();
  };
  return (
    <motion.div
      className="video-modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="video-modal glass-card"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>🎬 Share a Video</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="input"
            placeholder="Paste YouTube, Vimeo, or direct MP4 URL..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            autoFocus
          />
          <div className="text-muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
            ✅ YouTube links — ✅ Vimeo links — ✅ Direct .mp4 / .webm / .mov URLs
          </div>
          <button type="submit" className="btn btn-primary" disabled={!url.trim()}
            style={{ justifyContent: 'center' }}>
            🚀 Stream in Chat
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── SMART UPLOAD ZONE (dual-mode: Firestore + Storage) ──────
const SmartUploadZone = ({ onFilesSelected, uploading, uploadProgress }) => {
  const onDrop = useCallback((accepted) => {
    if (accepted.length) onFilesSelected(accepted);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: true, maxSize: 3 * 1024 * 1024 * 1024,
    onDropRejected: () => toast.error('File too large — max 3GB'),
  });

  return (
    <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'drag-active' : ''}`}>
      <input {...getInputProps()} />
      <div className="drop-zone-content">
        <div className="drop-zone-icon">{uploading ? '⏳' : isDragActive ? '📥' : '☁️'}</div>
        <div className="drop-zone-text">
          {uploading ? 'Uploading...' : isDragActive ? 'Drop files here!' : 'Drag & drop or click to upload'}
        </div>
        {uploading && uploadProgress > 0 && (
          <div className="progress-track" style={{ marginTop: '8px', width: '100%' }}>
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
        <div className="drop-zone-hint text-muted">
          ≤ 5MB: instant (free) • Up to 3GB: via cloud storage
        </div>
      </div>
    </div>
  );
};

// ─── MAIN ROOM COMPONENT ─────────────────────────────────────
export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuthStore();
  const { currentRoom, messages, participants, uploads, cryptoKey, setRoom, setMessages, setParticipants, setUploads, setCryptoKey, clearRoom } = useRoomStore();
  const { filesPanelOpen, activeTab, setActiveTab } = useUIStore();
  const { queue } = useUploadStore();

  const [messageText, setMessageText] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const [isTypingDebounce, setIsTypingDebounce] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadTask, setActiveUploadTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  // Decrypt messages as they arrive
  useEffect(() => {
    if (!cryptoKey || !messages.length) return;
    const decrypt = async () => {
      const results = {};
      await Promise.all(messages.map(async (msg) => {
        if (msg.encryptedContent && msg.iv) {
          results[msg.id] = await decryptMessage(msg.encryptedContent, msg.iv, cryptoKey);
        } else {
          results[msg.id] = msg.encryptedContent || '';
        }
      }));
      setDecryptedMessages(results);
    };
    decrypt();
  }, [messages, cryptoKey]);

  // Setup room subscriptions
  useEffect(() => {
    if (!user) return;

    let unsubRoom, unsubMessages, unsubParticipants, unsubUploads;

    const initRoom = async () => {
      const { getRoomById } = await import('../firebase/firestore');
      const room = await getRoomById(roomId);

      if (!room) { navigate('/dashboard'); return; }
      if (room.status === 'destroyed') { navigate('/destroyed'); return; }
      if (room.expiresAt?.toDate() < new Date()) { navigate('/destroyed'); return; }

      // Generate encryption key (uses room password embedded in session)
      const sessionPassword = sessionStorage.getItem(`room-pwd-${roomId}`) || '';
      const key = await generateRoomKey(roomId, sessionPassword);
      setCryptoKey(key);

      setRoom(room);
      setLoading(false);

      // Subscribe to all room data
      unsubRoom = subscribeToRoom(roomId, (r) => {
        if (!r || r.status === 'destroyed') { navigate('/destroyed'); return; }
        setRoom(r);
      });
      unsubMessages = subscribeToMessages(roomId, setMessages);
      unsubParticipants = subscribeToParticipants(roomId, setParticipants);
      unsubUploads = subscribeToUploads(roomId, setUploads);
    };

    initRoom();

    return () => {
      unsubRoom?.();
      unsubMessages?.();
      unsubParticipants?.();
      unsubUploads?.();
      if (user) leaveRoom(roomId, user.uid).catch(console.error);
      clearRoom();
    };
  }, [roomId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !cryptoKey) return;

    const text = messageText.trim();
    setMessageText('');
    clearTyping();

    try {
      const { encryptedContent, iv } = await encryptMessage(text, cryptoKey);
      await sendMessage(
        roomId, user.uid,
        userProfile?.username || user.displayName || 'Ghost',
        encryptedContent, iv, 'text'
      );
    } catch (err) {
      toast.error('Failed to send message');
      setMessageText(text);
    }
  };

  const handleShareVideo = async (url) => {
    if (!cryptoKey) return;
    try {
      const { encryptedContent, iv } = await encryptMessage(url, cryptoKey);
      await sendMessage(
        roomId, user.uid,
        userProfile?.username || user.displayName || 'Ghost',
        encryptedContent, iv, 'video'
      );
      toast.success('🎬 Video shared!');
    } catch (err) {
      toast.error('Failed to share video');
    }
  };

  // ── Smart file upload: small=Firestore, large=Storage ──
  const handleFileUpload = async (files) => {
    if (!cryptoKey) return;
    setUploading(true);
    setUploadProgress(0);
    const senderName = userProfile?.username || user.displayName || 'Ghost';

    for (const file of files) {
      let msgType = 'file';
      if (file.type.startsWith('image/')) msgType = 'image';
      else if (file.type.startsWith('video/')) msgType = 'video';
      else if (file.type.startsWith('audio/')) msgType = 'audio';
      else if (file.type === 'application/pdf') msgType = 'pdf';

      // SMALL FILES (≤5MB): base64 in Firestore (free)
      if (file.size <= 5 * 1024 * 1024) {
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const { encryptedContent, iv } = await encryptMessage(dataUrl, cryptoKey);
          await sendMessage(roomId, user.uid, senderName, encryptedContent, iv, msgType, file.name);
          toast.success(`📎 ${file.name} shared!`);
        } catch (err) {
          toast.error(`Failed: ${file.name}`);
        }
      } else {
        // LARGE FILES (>5MB up to 3GB): Firebase Storage (needs Blaze)
        try {
          const uploadId = await createUploadRecord(roomId, user.uid, {
            name: file.name, size: file.size, type: file.type, chunkCount: Math.ceil(file.size / (5*1024*1024))
          });
          await new Promise((resolve, reject) => {
            const task = uploadFileChunked(
              file, roomId, uploadId,
              (progress) => setUploadProgress(Math.round(progress)),
              async (downloadURL) => {
                setActiveUploadTask(null);
                const { encryptedContent, iv } = await encryptMessage(downloadURL, cryptoKey);
                await sendMessage(roomId, user.uid, senderName, encryptedContent, iv, msgType, file.name);
                toast.success(`📎 ${file.name} uploaded!`);
                resolve();
              },
              (err) => {
                setActiveUploadTask(null);
                toast.error(`Upload failed: ${file.name}. Upgrade to Blaze plan for large files.`);
                reject(err);
              }
            );
            setActiveUploadTask(task);
          });
        } catch (err) {
          if (err?.code === 'storage/unauthorized' || err?.code === 'storage/unknown') {
            toast.error(`⚡ Large files need Blaze plan. Upgrade at console.firebase.google.com`);
          }
        }
      }
    }
    setUploading(false);
    setUploadProgress(0);
    setActiveUploadTask(null);
  };

  const handleCancelUpload = () => {
    if (activeUploadTask) {
      activeUploadTask.cancel();
      setActiveUploadTask(null);
    }
    setUploading(false);
    setUploadProgress(0);
    toast('Upload cancelled');
  };

  const handleEmojiSelect = (emoji) => {
    const pos = inputRef.current?.selectionStart ?? messageText.length;
    setMessageText(prev => prev.slice(0, pos) + emoji + prev.slice(pos));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => {
        const text = decryptedMessages[msg.id] || '';
        return text.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : messages;

  const clearTyping = () => {
    if (isTypingDebounce) clearTimeout(isTypingDebounce);
    setTyping(roomId, user.uid, false).catch(() => {});
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    setTyping(roomId, user.uid, true).catch(() => {});
    if (isTypingDebounce) clearTimeout(isTypingDebounce);
    const t = setTimeout(() => setTyping(roomId, user.uid, false).catch(() => {}), 2000);
    setIsTypingDebounce(t);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleDestroyRoom = async () => {
    if (!window.confirm('⚠️ Destroy this room? All data will be permanently deleted.')) return;
    try {
      await destroyRoom(roomId, user.uid);
      navigate('/destroyed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(currentRoom?.inviteLink || '');
    toast.success('Invite link copied!');
  };

  const typingParticipants = participants.filter(p => p.isTyping && p.userId !== user.uid);
  const onlineParticipants = participants.filter(p => p.isOnline);

  if (loading) return <SkeletonRoom />;

  if (!currentRoom) return null;

  return (
    <div className="room-layout">
      {/* ─── ROOM HEADER ─── */}
      <header className="room-header">
        <div className="room-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>←</button>
          <div className="room-header-info">
            <div className="room-header-name">
              {currentRoom.hasPassword && '🔐'} {currentRoom.name}
            </div>
            <div className="room-header-id text-muted">#{currentRoom.id}</div>
          </div>
        </div>

        <div className="room-header-center">
          {currentRoom.expiresAt && <CountdownTimer expiresAt={currentRoom.expiresAt} />}
        </div>

        <div className="room-header-right">
          <button
            className="btn btn-ghost btn-sm room-header-btn"
            onClick={() => setShowSearch(!showSearch)}
            data-tooltip="Search Messages"
          >🔍</button>
          <button
            className="btn btn-ghost btn-sm room-header-btn"
            onClick={() => setShowParticipants(!showParticipants)}
            data-tooltip="Members"
          >
            👥 <span className="online-count">{onlineParticipants.length}</span>
          </button>
          <button
            className="btn btn-ghost btn-sm room-header-btn"
            onClick={() => setShowQR(!showQR)}
            data-tooltip="QR Code"
          >📱</button>
          <button
            className="btn btn-ghost btn-sm room-header-btn"
            onClick={copyInviteLink}
            data-tooltip="Copy Invite"
          >🔗</button>
          {currentRoom.createdBy === user.uid && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDestroyRoom}
              data-tooltip="Destroy Room"
            >💣</button>
          )}
        </div>
      </header>

      {/* ─── SEARCH BAR ─── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}
          >
            <div style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>🔍</span>
              <input
                className="message-input"
                placeholder={`Search in ${messages.length} messages...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{ flex: 1, height: '36px', fontSize: '13px' }}
              />
              {searchQuery && (
                <span className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                </span>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearchQuery(''); setShowSearch(false); }}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <div className="room-body">
        {/* ─── CHAT PANEL ─── */}
        <div className="chat-panel">
          {/* Messages */}
          <div className="messages-container">
            <AnimatePresence initial={false}>
            {filteredMessages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.senderId === user.uid}
                decryptedText={decryptedMessages[msg.id]}
              />
            ))}
          </AnimatePresence>
          {searchQuery && filteredMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              🔍 No messages match "{searchQuery}"
            </div>
          )}

            {typingParticipants.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-indicator-dots">
                  <span/><span/><span/>
                </div>
                <span className="text-muted" style={{ fontSize: '13px' }}>
                  {typingParticipants.map(p => p.username).join(', ')} typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form className="message-input-form" onSubmit={handleSendMessage}>
            <div className="message-input-wrapper">
              <input
                ref={inputRef}
                className="message-input"
                placeholder="Type an encrypted message... (Enter to send)"
                value={messageText}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              <div className="message-input-actions">
                <input type="file" ref={fileInputRef} hidden multiple
                  onChange={(e) => { handleFileUpload(Array.from(e.target.files)); e.target.value = ''; }} />
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()} data-tooltip="Upload File">
                  📎
                </button>
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => setShowVideoModal(true)} data-tooltip="Stream Video URL">
                  🎬
                </button>
                <button type="submit" className="btn btn-primary btn-sm"
                  disabled={!messageText.trim()} data-tooltip="Send (Enter)">
                  ➤
                </button>
              </div>
            </div>
            <div className="encryption-note">🔐 Encrypted · 📎 Files up to 3GB · 🎬 Stream video URLs</div>
          </form>

          {/* Video Modal */}
          <AnimatePresence>
            {showVideoModal && (
              <VideoShareModal
                onClose={() => setShowVideoModal(false)}
                onShare={handleShareVideo}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="room-right-panel">
          {/* Tab Bar */}
          <div className="room-tabs">
            {['files', 'members'].map(tab => (
              <button
                key={tab}
                className={`room-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'files' ? `📁 Files (${uploads.length})` : `👥 Members (${participants.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'files' && (
            <div className="files-panel">
              <SmartUploadZone onFilesSelected={handleFileUpload} uploading={uploading} uploadProgress={uploadProgress} />
              <div style={{ padding: '8px 0', display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowVideoModal(true)}>
                  🎬 Stream URL
                </button>
                <button className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => fileInputRef.current?.click()}>
                  📎 Upload File
                </button>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-panel">
              {participants.map(p => (
                <motion.div
                  key={p.id}
                  className="member-item"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="member-avatar">
                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${p.userId}`} alt={p.username} />
                    <div className={`member-status-dot ${p.isOnline ? 'online' : 'offline'}`} />
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {p.username}
                      {p.userId === currentRoom.createdBy && <span className="badge badge-purple" style={{ marginLeft: '6px', fontSize: '9px' }}>Admin</span>}
                    </div>
                    <div className="member-status text-muted">
                      {p.isTyping ? '✍️ typing...' : p.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </div>
                  </div>
                  <div className={`badge badge-${p.role === 'admin' ? 'purple' : 'cyan'}`} style={{ fontSize: '10px' }}>
                    {p.role}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* QR Code Panel */}
          {showQR && (
            <motion.div
              className="qr-panel glass-card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="qr-panel-header">
                <span>📱 Room QR Code</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(false)}>✕</button>
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentRoom.inviteLink || '')}&bgcolor=0f0f1a&color=a78bfa&margin=8`}
                alt="Room QR"
                style={{ borderRadius: '8px', width: '160px' }}
              />
              <button className="btn btn-secondary btn-sm" onClick={copyInviteLink} style={{ width: '100%', justifyContent: 'center' }}>
                🔗 Copy Invite Link
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
