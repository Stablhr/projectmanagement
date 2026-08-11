import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5199,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4199',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4199',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4199',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
