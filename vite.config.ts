import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  cacheDir: './runtime/vite-cache',
  server: { host: '127.0.0.1', port: 4174, strictPort: true },
  preview: { host: '127.0.0.1', port: 4175, strictPort: true },
  test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx,mjs}'], restoreMocks: true },
});
