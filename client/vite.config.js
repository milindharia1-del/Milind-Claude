import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Copy world-atlas topojson into public so react-simple-maps can fetch it
// from the same origin — avoids any ESM/bundling issues with JSON imports.
const copyWorldAtlas = {
  name: 'copy-world-atlas',
  buildStart() {
    const src = path.resolve('./node_modules/world-atlas/countries-110m.json');
    const dest = path.resolve('./public/world-110m.json');
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), copyWorldAtlas],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
});
