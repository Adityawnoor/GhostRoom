// GhostRoom — End-to-End Encryption Module (Web Crypto API)
// All encryption/decryption happens client-side only
// Firebase stores only encrypted ciphertext

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// ─── KEY GENERATION ──────────────────────────────────────────
export const generateRoomKey = async (roomId, password) => {
  const baseStr = `ghostroom-${roomId}-${password || 'public'}`;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(baseStr),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`salt-${roomId}`),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
};

// ─── ENCRYPT ─────────────────────────────────────────────────
export const encryptMessage = async (plaintext, cryptoKey) => {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    encoder.encode(plaintext)
  );

  return {
    encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

// ─── DECRYPT ─────────────────────────────────────────────────
export const decryptMessage = async (encryptedContent, ivBase64, cryptoKey) => {
  try {
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      cryptoKey,
      data
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return '[Encrypted Message]';
  }
};
