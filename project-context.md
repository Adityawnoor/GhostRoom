# GhostRoom Project Context

## Project Overview
**GhostRoom** is a secure, temporary, zero-trace SaaS platform that acts as a hybrid of Telegram, Snapchat, WeTransfer, Google Drive, and Slack. It provides real-time E2E encrypted chat and file sharing, wrapped in a pure-black monochrome premium UI, with self-destructing rooms.

## Tech Stack
**Frontend:**
- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Styling:** Custom CSS (Monochrome, glassmorphism UI)
- **Encryption:** Web Crypto API (AES-256-GCM)
- **Other utilities:** `react-dropzone` (file uploads), `react-hot-toast` (notifications), `react-qr-code`, `uuid`, `date-fns`, `emoji-mart`

**Backend (Firebase):**
- **Authentication:** Firebase Auth (Email/Password, Anonymous/Guest, Google OAuth)
- **Database:** Cloud Firestore (Real-time database with security rules)
- **Storage:** Firebase Storage (File hosting with security rules)
- **Functions:** Cloud Functions (Cleanup, moderation, auto-destruction)
- **Hosting & Analytics:** Firebase Hosting & Firebase Analytics

## Features
- **Authentication:** Email/Password, Anonymous Guest Mode, Google OAuth.
- **Room Management:** Room creation with password, QR Code + Invite Link sharing.
- **Real-Time Chat:** Typing indicators, member online presence.
- **Security & Privacy:** E2E Encryption (AES-256-GCM), Countdown self-destruct timer, Auto-room destruction via Cloud Functions.
- **File Sharing:** Multi-file drag & drop upload, chunked resumable uploads, support for up to 10GB files, file previews (image/video/audio/PDF), file security (malware extension blocking).
- **Other:** Dashboard with analytics, PWA support, responsive mobile-friendly design, SEO optimization.

## File Structure
```
GHOSTROOM/
├── src/
│   ├── pages/              # Route-level pages (Landing, Auth, Dashboard, CreateRoom, JoinRoom, Room, etc.)
│   ├── firebase/           # Firebase service layer (config, auth, firestore, storage)
│   ├── crypto/             # E2E encryption logic (AES-256-GCM)
│   ├── store/              # Zustand state management
│   ├── components/         # Reusable UI components
│   ├── App.jsx             # Router + auth guards
│   ├── main.jsx            # Entry point
│   └── index.css           # Global design system
├── functions/              # Cloud Functions (cleanup, moderation)
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
├── firestore.indexes.json  # Composite indexes
├── firebase.json           # Firebase config
└── package.json            # Dependencies and scripts
```

## Security Architecture
- **Encryption Flow:** Firebase never sees plaintext. The encryption key is derived client-side from the room ID + password using PBKDF2 with 100,000 iterations. Messages are encrypted using AES-256-GCM.
- **Self-Destruct Flow:** When a room expires (timer hits 0) or is manually destroyed, a Cloud Function triggers. It wipes all messages, participants, upload records from Firestore, files from Storage, and finally the room document. Zero trace remains.

## Instructions for ChatGPT
*Act as an expert software developer and architect. The user is providing this document to give you full context on the GhostRoom project. Use this information to understand the project's architecture, tools, and goals whenever assisting with debugging, adding features, or explaining code for this codebase.*
