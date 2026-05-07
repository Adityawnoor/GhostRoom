// GhostRoom — Global Zustand State Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── AUTH STORE ──────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setLoading: (val) => set({ isLoading: val }),
      clearAuth: () => set({ user: null, userProfile: null }),
    }),
    { name: 'ghostroom-auth', partialize: (s) => ({ userProfile: s.userProfile }) }
  )
);

// ─── ROOM STORE ──────────────────────────────────────────────
export const useRoomStore = create((set) => ({
  currentRoom: null,
  messages: [],
  participants: [],
  uploads: [],
  cryptoKey: null,
  isConnected: false,
  typingUsers: [],
  setRoom: (room) => set({ currentRoom: room }),
  setMessages: (messages) => set({ messages }),
  setParticipants: (participants) => set({ participants }),
  setUploads: (uploads) => set({ uploads }),
  setCryptoKey: (key) => set({ cryptoKey: key }),
  setConnected: (val) => set({ isConnected: val }),
  setTypingUsers: (users) => set({ typingUsers: users }),
  clearRoom: () => set({
    currentRoom: null, messages: [], participants: [],
    uploads: [], cryptoKey: null, isConnected: false, typingUsers: []
  }),
}));

// ─── UI STORE ────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  filesPanelOpen: true,
  activeTab: 'chat',
  notifications: [],
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleFilesPanel: () => set(s => ({ filesPanelOpen: !s.filesPanelOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addNotification: (n) => set(s => ({ notifications: [n, ...s.notifications].slice(0, 10) })),
  clearNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}));

// ─── UPLOAD STORE ────────────────────────────────────────────
export const useUploadStore = create((set) => ({
  queue: [],
  addToQueue: (item) => set(s => ({ queue: [...s.queue, item] })),
  updateQueueItem: (id, updates) => set(s => ({
    queue: s.queue.map(i => i.id === id ? { ...i, ...updates } : i)
  })),
  removeFromQueue: (id) => set(s => ({ queue: s.queue.filter(i => i.id !== id) })),
  clearQueue: () => set({ queue: [] }),
}));
