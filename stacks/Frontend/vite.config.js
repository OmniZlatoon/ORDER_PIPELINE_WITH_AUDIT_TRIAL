import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/fapshi_demo": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    allowedHosts: ["subtarsal-kathyrn-untreated.ngrok-free.dev"],
  },
});
