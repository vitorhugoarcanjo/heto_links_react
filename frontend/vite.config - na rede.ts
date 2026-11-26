import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});