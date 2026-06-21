# 👻 GhostRoom — Secure. Temporary. Zero Trace.

A privacy-first real-time communication and file-sharing platform

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)

---

## 🚀 Features

| Feature | Status |
|---------|--------|
| Email/Password Auth | ✅ |
| Guest Anonymous Mode | ✅ |
| Google OAuth | ✅ |
| Room Creation with Password | ✅ |
| QR Code + Invite Link Sharing | ✅ |
| Real-Time Chat (Firestore) | ✅ |
| Typing Indicators | ✅ |
| E2E Encryption (AES-256-GCM) | ✅ |
| Countdown Self-Destruct Timer | ✅ |
| Auto-Room Destruction (Cloud Functions) | ✅ |
| Multi-File Drag & Drop Upload | ✅ |
| Chunked Resumable Uploads | ✅ |
| 10GB File Support | ✅ |
| File Preview (image/video/audio/PDF) | ✅ |
| File Security (malware extension blocking) | ✅ |
| Dashboard with Analytics | ✅ |
| Member Online Presence | ✅ |
| Pricing Page (Free/Pro/Business) | ✅ |
| PWA Support | ✅ |
| SEO Optimization | ✅ |
| Firestore Security Rules | ✅ |
| Storage Security Rules | ✅ |
| Firebase Hosting Config | ✅ |

---

## 🏗️ Tech Stack

**Frontend (Antigravity)**
- React 18 + Vite
- Framer Motion (animations)
- Zustand (state management)
- React Router v6
- Web Crypto API (E2E encryption)
- react-dropzone (file uploads)
- react-hot-toast (notifications)

**Backend (Firebase)**
- Firebase Authentication
- Cloud Firestore (real-time database)
- Firebase Storage (file hosting)
- Cloud Functions (cleanup + moderation)
- Firebase Hosting
- Firebase Analytics

---

## 🛠️ Setup Guide

### 1. Clone & Install

```bash
git clone <repo>
cd GHOSTROOM
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named `ghostroom-app`
3. Enable these services:
   - **Authentication** → Email/Password + Anonymous + Google
   - **Firestore Database** → Start in production mode
   - **Storage** → Start in production mode
   - **Functions** → Enable billing (Blaze plan)
   - **Analytics** → Enable

4. Copy your Firebase config from Project Settings → General → Your Apps

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

Fill in all `VITE_FIREBASE_*` values from your Firebase project.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select your project)
firebase use --add

# Deploy rules
firebase deploy --only firestore:rules,storage
```

### 6. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 7. Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## 📁 Project Structure

```
GHOSTROOM/
├── src/
│   ├── pages/              # Route-level pages
│   │   ├── Landing.jsx     # Marketing landing page
│   │   ├── Auth.jsx        # Login/Signup/Guest
│   │   ├── Dashboard.jsx   # User dashboard
│   │   ├── CreateRoom.jsx  # Room creation wizard
│   │   ├── JoinRoom.jsx    # Room join flow
│   │   ├── Room.jsx        # Main room interface
│   │   ├── Profile.jsx     # User profile
│   │   ├── Settings.jsx    # App settings
│   │   ├── Pricing.jsx     # Pricing plans
│   │   ├── Destroyed.jsx   # Post-destruction screen
│   │   └── NotFound.jsx    # 404 page
│   ├── firebase/           # Firebase service layer
│   │   ├── config.js       # Firebase initialization
│   │   ├── auth.js         # Auth operations
│   │   ├── firestore.js    # Database operations
│   │   └── storage.js      # File upload/download
│   ├── crypto/
│   │   └── encryption.js   # AES-256-GCM E2E encryption
│   ├── store/
│   │   └── index.js        # Zustand state management
│   ├── App.jsx             # Router + auth guards
│   ├── main.jsx            # Entry point
│   └── index.css           # Global design system
├── functions/
│   └── src/index.js        # Cloud Functions (cleanup, moderation)
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
├── firestore.indexes.json  # Composite indexes
├── firebase.json           # Firebase config
└── vite.config.js          # Build config
```

---

## 🔐 Security Architecture

### Encryption Flow
```
User types message
       ↓
generateRoomKey(roomId + password)  [PBKDF2, 100k iterations]
       ↓
encryptMessage(plaintext, key)  [AES-256-GCM]
       ↓
Store { encryptedContent, iv } in Firestore
       ↓
Other users fetch ciphertext
       ↓
decryptMessage(ciphertext, iv, key)  [client-side only]
       ↓
Display plaintext
```

Firebase **never** sees plaintext. The encryption key is derived client-side from the room ID + password using PBKDF2 with 100,000 iterations.

### Self-Destruct Flow
```
Room expires (timer → 0) OR manual destroy
       ↓
Cloud Function triggered
       ↓
Delete all /messages subcollection
Delete all /participants subcollection
Delete all /uploads records from Firestore
Delete all files from Firebase Storage
Delete room document
       ↓
Zero trace remains
```

---

## 💰 Monetization

| Tier | Price | Key Limits |
|------|-------|-----------|
| Free | $0/mo | 10 rooms, 100MB files, 24hr expiry |
| Pro | $12/mo | Unlimited rooms, 10GB files, 30d expiry |
| Business | $49/mo | Team rooms, SSO, API, SLA |

---

## 📊 Firestore Indexes Required

Deploy `firestore.indexes.json` before production — the app queries rooms by `createdBy + createdAt` and uploads by `roomId + createdAt`.

---

## 🚀 Production Checklist

- [ ] Firebase project created with Blaze plan
- [ ] All Firebase services enabled
- [ ] `.env` filled with real credentials
- [ ] `firebase login` complete
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Firestore indexes deployed
- [ ] Cloud Functions deployed
- [ ] `npm run build` successful
- [ ] Firebase Hosting deployed
- [ ] Custom domain configured (optional)
- [ ] Firebase App Check enabled (optional, for anti-abuse)

---

## 📄 License

MIT — Built with 👻 by the GhostRoom team.
