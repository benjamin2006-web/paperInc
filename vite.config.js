import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://paperincbackend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://paperincbackend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    target: 'esnext',
    // ✅ FIX 1: Change 'esbuild' to 'oxc' for Vite 8 compatibility
    // without needing to install extra packages.
    minify: 'oxc',
    sourcemap: false,
    rollupOptions: {
      output: {
        // ✅ FIX 2: Correct function syntax for Vite 8/Rolldown
        manualChunks(id) {
          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('react-router-dom')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'react-icons'],
  },
});
