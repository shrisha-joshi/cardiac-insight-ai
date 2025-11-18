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
    // Suppress large chunk warnings and improve chunking
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          tanstack: ["@tanstack/react-query"],
        },
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
