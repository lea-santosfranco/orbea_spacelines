import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En développement, les appels à /api sont transmis à l'API Express
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});