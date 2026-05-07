import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'ghost-icon.png'],
      manifest: {
        name: 'GhostRoom — Secure. Temporary. Zero Trace.',
        short_name: 'GhostRoom',
        description: 'Encrypted self-destructing rooms for secure chat and file sharing',
        theme_color: '#0f0f1a',
        background_color: '#0f0f1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: 'ghost-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'ghost-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        categories: ['productivity', 'utilities'],
        shortcuts: [
          { name: 'Create Room', short_name: 'Create', description: 'Create a new secure room', url: '/create', icons: [{ src: 'ghost-96.png', sizes: '96x96' }] },
          { name: 'Join Room', short_name: 'Join', description: 'Join an existing room', url: '/join', icons: [{ src: 'ghost-96.png', sizes: '96x96' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.googleapis\.com/, handler: 'CacheFirst' },
          { urlPattern: /^https:\/\/api\.dicebear\.com/, handler: 'StaleWhileRevalidate' },
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: { port: 5173, host: true },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
  }
})
