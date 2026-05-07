// GhostRoom — Firestore Service Layer
import {
  doc, collection, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, Timestamp, writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './config';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

// ─── ROOM OPERATIONS ─────────────────────────────────────────

export const createRoom = async (userId, options) => {
  const { name, password, expiryMinutes, maxParticipants } = options;
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const passwordHash = password ? CryptoJS.SHA256(password).toString() : null;
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + expiryMinutes * 60 * 1000));
  const inviteLink = `${window.location.origin}/join/${roomId}`;

  const roomData = {
    id: roomId,
    name: name || `Room ${roomId}`,
    passwordHash,
    hasPassword: !!password,
    createdBy: userId,
    createdAt: serverTimestamp(),
    expiresAt,
    expiryMinutes,
    maxParticipants: maxParticipants || 50,
    status: 'active',
    inviteLink,
    participantCount: 1,
    messageCount: 0,
    fileCount: 0,
  };

  await setDoc(doc(db, 'rooms', roomId), roomData);
  await setDoc(doc(db, 'users', userId), { roomsCreated: increment(1) }, { merge: true });

  return { roomId, inviteLink };
};

export const joinRoom = async (roomId, password, userId, username) => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = roomSnap.data();

  if (room.status === 'destroyed') throw new Error('Room has been destroyed');
  if (room.expiresAt.toDate() < new Date()) throw new Error('Room has expired');

  if (room.hasPassword) {
    const hash = CryptoJS.SHA256(password).toString();
    if (hash !== room.passwordHash) throw new Error('Incorrect password');
  }

  const participantRef = doc(db, 'rooms', roomId, 'participants', userId);
  const existing = await getDoc(participantRef);

  if (!existing.exists()) {
    await setDoc(participantRef, {
      userId,
      username,
      joinedAt: serverTimestamp(),
      isOnline: true,
      lastSeen: serverTimestamp(),
      role: room.createdBy === userId ? 'admin' : 'member',
    });
    await updateDoc(roomRef, { participantCount: increment(1) });
    await setDoc(doc(db, 'users', userId), { roomsJoined: increment(1) }, { merge: true });
  } else {
    await updateDoc(participantRef, { isOnline: true, lastSeen: serverTimestamp() });
  }

  return room;
};

export const leaveRoom = async (roomId, userId) => {
  const participantRef = doc(db, 'rooms', roomId, 'participants', userId);
  await updateDoc(participantRef, { isOnline: false, lastSeen: serverTimestamp() });
};

export const destroyRoom = async (roomId, userId) => {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;

  const room = roomSnap.data();
  if (room.createdBy !== userId) throw new Error('Only the room creator can destroy it');

  await updateDoc(roomRef, { status: 'destroyed', destroyedAt: serverTimestamp() });
};

export const getRoomById = async (roomId) => {
  const snap = await getDoc(doc(db, 'rooms', roomId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getUserRooms = async (userId) => {
  const q = query(collection(db, 'rooms'), where('createdBy', '==', userId), orderBy('createdAt', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── REAL-TIME LISTENERS ────────────────────────────────────

export const subscribeToRoom = (roomId, callback) => {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    else callback(null);
  });
};

export const subscribeToMessages = (roomId, callback) => {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
};

export const subscribeToParticipants = (roomId, callback) => {
  return onSnapshot(collection(db, 'rooms', roomId, 'participants'), (snap) => {
    const participants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(participants);
  });
};

// ─── MESSAGES ───────────────────────────────────────────────

export const sendMessage = async (roomId, senderId, senderName, encryptedContent, iv, type = 'text', fileName = null) => {
  const msgData = {
    senderId,
    senderName,
    encryptedContent,
    iv,
    type,
    timestamp: serverTimestamp(),
    delivered: true,
  };
  if (fileName) msgData.fileName = fileName;
  const ref = await addDoc(collection(db, 'rooms', roomId, 'messages'), msgData);
  await updateDoc(doc(db, 'rooms', roomId), { messageCount: increment(1) });
  return ref.id;
};

export const setTyping = async (roomId, userId, isTyping) => {
  const ref = doc(db, 'rooms', roomId, 'participants', userId);
  await updateDoc(ref, { isTyping, lastSeen: serverTimestamp() });
};

// ─── FILE UPLOADS ───────────────────────────────────────────

export const createUploadRecord = async (roomId, userId, fileInfo) => {
  const uploadId = uuidv4();
  await setDoc(doc(db, 'uploads', uploadId), {
    id: uploadId,
    roomId,
    uploadedBy: userId,
    fileName: fileInfo.name,
    fileSize: fileInfo.size,
    mimeType: fileInfo.type,
    storagePath: `rooms/${roomId}/files/${uploadId}/${fileInfo.name}`,
    chunkCount: fileInfo.chunkCount || 1,
    chunksUploaded: 0,
    status: 'uploading',
    downloadURL: null,
    createdAt: serverTimestamp(),
  });
  return uploadId;
};

export const updateUploadProgress = async (uploadId, chunksUploaded, status, downloadURL = null) => {
  const data = { chunksUploaded, status };
  if (downloadURL) data.downloadURL = downloadURL;
  await updateDoc(doc(db, 'uploads', uploadId), data);
};

export const getRoomUploads = async (roomId) => {
  const q = query(collection(db, 'uploads'), where('roomId', '==', roomId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subscribeToUploads = (roomId, callback) => {
  const q = query(collection(db, 'uploads'), where('roomId', '==', roomId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};
