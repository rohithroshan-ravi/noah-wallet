import { createServer } from "http";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function extensionReloadPlugin(): Plugin {
  let buildCount = 0;
  let serverStarted = false;

  function startServer() {
    if (serverStarted) return;
    serverStarted = true;

    const server = createServer((_req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ build: buildCount }));
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code !== "EADDRINUSE") console.error("[reload]", err);
    });

    server.listen(8765, () => console.log("[reload] server listening on :8765"));
  }

  return {
    name: "extension-reload",
    closeBundle() {
      buildCount++;

      // Patch the copied manifest to include the dev-reload content script
      const manifestPath = resolve(__dirname, "dist/manifest.json");
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        manifest.content_scripts = (manifest.content_scripts ?? []).filter(
          (cs: { js?: string[] }) => !cs.js?.includes("dev-reload.js")
        );
        manifest.content_scripts.push({
          matches: ["<all_urls>"],
          js: ["dev-reload.js"],
          run_at: "document_idle"
        });
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      } catch {
        // dist/manifest.json not written yet on very first build — ignore
      }

      startServer();
      console.log(`[reload] build #${buildCount} ready — reload your extension`);
    }
  };
}
