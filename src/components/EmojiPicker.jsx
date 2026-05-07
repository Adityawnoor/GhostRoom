import React, { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion } from 'framer-motion';

export default function EmojiPicker({ onEmojiSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '0',
        zIndex: 50,
        filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
      }}
    >
      <Picker
        data={data}
        onEmojiSelect={(e) => { onEmojiSelect(e.native); onClose(); }}
        theme="dark"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
        perLine={8}
      />
    </motion.div>
  );
}
