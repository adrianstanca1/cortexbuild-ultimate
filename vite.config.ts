import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["localhost", "127.0.0.1"],
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/ws": { target: "ws://localhost:3001", ws: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_BASE_URL ||
        (process.env.NODE_ENV === "production"
          ? "https://www.cortexbuildpro.com"
          : "http://localhost:3001"),
    ),
  },
  build: {
    emptyOutDir: true,
    target: "es2020",
    minify: "esbuild",
    // web-ifc WASM is ~2MB and lazy-loaded with BIMViewer — expected for IFC parsing
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3")
          )
            return "charts";
          if (id.includes("node_modules/lucide-react")) return "icons";
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          )
            return "vendor";
          if (id.includes("node_modules/zod")) return "validation";
          if (id.includes("node_modules/@tanstack")) return "tanstack";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
    exclude: ["@rollup/rolldown-linux-arm64-gnu"],
  },
});
