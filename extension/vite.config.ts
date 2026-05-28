import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { extensionReloadPlugin } from "./reload-plugin";

const isWatch = process.argv.includes("--watch");

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "." },
        { src: "public/icons/*", dest: "icons" }
      ]
    }),
    ...(isWatch ? [extensionReloadPlugin()] : [])
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "app/index.html"),
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
        inpage: resolve(__dirname, "src/inpage.ts"),
        ...(isWatch ? { "dev-reload": resolve(__dirname, "src/dev-reload.ts") } : {})
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
