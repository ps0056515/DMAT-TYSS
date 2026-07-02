import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 3400, strictPort: true },
  resolve: {
    alias: {
      '@dmat/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      '@dmat/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
      '@dmat/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
});
