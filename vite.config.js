/**
 * Optimized Vite Configuration - Production Ready
 * Includes code splitting, compression, and performance optimizations
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
    })
  ],

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@config': resolve(__dirname, 'src/config'),
    }
  },

  // Build optimizations
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
      }
    },

    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return null;

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
            return 'react-vendor';
          }

          if (id.includes('/recharts/')) {
            return 'chart-vendor';
          }

          if (id.includes('/axios/') || id.includes('/socket.io-client/')) {
            return 'network-vendor';
          }

          if (id.includes('/date-fns/')) {
            return 'date-vendor';
          }

          if (id.includes('/jspdf/') || id.includes('/jspdf-autotable/')) {
            return 'pdf-vendor';
          }

          if (id.includes('/lucide-react/')) {
            return 'ui-vendor';
          }

          const nm = id.split('node_modules/')[1] || '';
          const parts = nm.split('/').filter(Boolean);
          if (parts.length === 0) {
            return 'misc-vendor';
          }

          let pkg = parts[0];
          if (pkg.startsWith('@') && parts.length > 1) {
            pkg = `${pkg}/${parts[1]}`;
          }

          const safePkg = pkg.replace('@', '').replace('/', '-');
          return `vendor-${safePkg}`;
        },
        // Asset naming
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 600,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
  },

  // Development server
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    open: false,
    cors: true,
    
    // Proxy API requests in development
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },

  // Preview server (for production build testing)
  preview: {
    port: 4173,
    host: true,
    strictPort: false
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'socket.io-client',
      'lucide-react',
      'recharts',
      'date-fns'
    ],
    exclude: []
  },

  // Environment variables
  envPrefix: 'VITE_',

  // Enable esbuild optimization
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none'
  },

  // CSS configuration
  css: {
    devSourcemap: mode === 'development',
    postcss: './postcss.config.js'
  }
}));
