import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { plugin as elm } from 'vite-plugin-elm';

export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx|js)$/,
    }),
    elm({
      debug: process.env.NODE_ENV !== 'production',
      optimize: process.env.NODE_ENV === 'production',
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.elm', '.res.js'],
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
