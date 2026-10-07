import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/react(?:-dom|-router-dom)?[\\/]/.test(id)) return 'react-vendor';
          if (/react-hook-form|@hookform|[\\/]zod[\\/]/.test(id)) return 'forms-vendor';
          if (/[\\/]axios[\\/]/.test(id)) return 'http-vendor';
          return 'vendor';
        },
      },
    },
  },
});
