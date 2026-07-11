import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// App servido pelo server.js na raiz (é a versão definitiva; o vanilla v1 foi removido).
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 4031,
    proxy: { "/api": "http://localhost:4022" }, // dev: usa a API do server.js
  },
});
