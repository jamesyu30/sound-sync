import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist/client",
    emptyOutDir: false
  },
  server: {
    proxy: {
      
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      "/login": { target: "http://localhost:4000", changeOrigin: true, secure: false },
      "/logout": { target: "http://localhost:4000", changeOrigin: true, secure: false },
      "/user": { target: "http://localhost:4000", changeOrigin: true, secure: false },
    },
  },
})
