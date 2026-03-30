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
    // ✅ Change from 'oxc' to 'esbuild' for better Vercel compatibility
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
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
