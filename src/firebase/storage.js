// GhostRoom — Firebase Storage Service
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './config';
import { updateUploadProgress } from './firestore';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

// ─── CHUNKED UPLOAD ENGINE ────────────────────────────────────
export const uploadFileChunked = async (file, roomId, uploadId, onProgress, onComplete, onError) => {
  const storageRef = ref(storage, `rooms/${roomId}/files/${uploadId}/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress?.(progress, snapshot.bytesTransferred, snapshot.totalBytes);
    },
    (error) => {
      console.error('Upload error:', error);
      updateUploadProgress(uploadId, 0, 'failed');
      onError?.(error);
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      await updateUploadProgress(uploadId, 1, 'complete', downloadURL);
      onComplete?.(downloadURL);
    }
  );

  return uploadTask;
};

// ─── DIRECT SMALL FILE UPLOAD ─────────────────────────────────
export const uploadFileDirect = async (file, roomId, uploadId) => {
  const storageRef = ref(storage, `rooms/${roomId}/files/${uploadId}/${file.name}`);
  const snapshot = await uploadBytesResumable(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

// ─── DELETE ROOM FILES ────────────────────────────────────────
export const deleteRoomFiles = async (roomId) => {
  const folderRef = ref(storage, `rooms/${roomId}/files`);
  try {
    const result = await listAll(folderRef);
    const deletePromises = [];
    for (const prefix of result.prefixes) {
      const files = await listAll(prefix);
      files.items.forEach(item => deletePromises.push(deleteObject(item)));
    }
    result.items.forEach(item => deletePromises.push(deleteObject(item)));
    await Promise.all(deletePromises);
  } catch (e) {
    console.warn('No files to delete or error:', e);
  }
};

// ─── GET DOWNLOAD URL ─────────────────────────────────────────
export const getFileURL = async (storagePath) => {
  const fileRef = ref(storage, storagePath);
  return getDownloadURL(fileRef);
};
