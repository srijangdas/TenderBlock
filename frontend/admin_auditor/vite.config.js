import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy: { '/api/v1': { target: env.VITE_BACKEND_TARGET || 'http://localhost:8080', changeOrigin: true } } },
  };
});
