import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

const plugins: PluginOption[] = [react()];

if (process.env.ANALYZE) {
  plugins.push(
    visualizer({
      filename: "./dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  envDir: "../..",
  server: {
    host: "::",
    port: 8080,
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query", "zustand"],
          "vendor-ui": ["recharts", "lucide-react", "@tanstack/react-virtual"],
          "vendor-utils": ["dagre"],
        },
      },
    },
  },
});
