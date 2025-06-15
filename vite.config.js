import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";


export default defineConfig({
  plugins: [
    vue(),
    tailwindcss({
      content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
        "./src/views/**/*.vue",
        "./src/components/**/*.vue"
      ]
    }), 
    vueDevTools()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
