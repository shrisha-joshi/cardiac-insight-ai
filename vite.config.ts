import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    middlewareMode: false,
  },
  build: {
    // Phase 8: Bundle size optimization
    chunkSizeWarningLimit: 3000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          vendor: ["react", "react-dom", "react-router-dom"],
          // Data & API
          supabase: ["@supabase/supabase-js"],
          tanstack: ["@tanstack/react-query"],
          // UI Components
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-toast"],
          // Charts & Visualization
          charts: ["recharts"],
          // AI Services
          ai: ["@google/generative-ai"],
          // PDF & Utilities
          pdf: ["jspdf"],
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  plugins: [
    react(),
    // mode === 'development' &&
    // componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vitest configuration for component/unit testing
  test: {
    // Using happy-dom for faster, Node-compatible DOM emulation
    // Avoid jsdom ESM engine/version issues on current Node runtime
    environment: 'happy-dom',
    globals: true,
    setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],
    css: true,
  },
}));
