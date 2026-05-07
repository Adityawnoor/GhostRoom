// GhostRoom — Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export const signUp = async (email, password, username) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email,
    username,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
    plan: 'free',
    createdAt: serverTimestamp(),
    roomsCreated: 0,
    roomsJoined: 0,
    totalUploadBytes: 0,
  });
  return cred.user;
};

export const signIn = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const signInAsGuest = async () => {
  const cred = await signInAnonymously(auth);
  const name = `Ghost_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email: null,
    username: name,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
    plan: 'free',
    isGuest: true,
    createdAt: serverTimestamp(),
    roomsCreated: 0,
    roomsJoined: 0,
    totalUploadBytes: 0,
  });
  return cred.user;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      username: cred.user.displayName || `User_${cred.user.uid.slice(0, 6)}`,
      avatar: cred.user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${cred.user.uid}`,
      plan: 'free',
      createdAt: serverTimestamp(),
      roomsCreated: 0,
      roomsJoined: 0,
      totalUploadBytes: 0,
    });
  }
  return cred.user;
};

export const logOut = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};
