let lastBuild: number | null = null;

async function poll() {
  try {
    const res = await fetch("http://localhost:8765/");
    const { build } = (await res.json()) as { build: number };
    if (lastBuild !== null && build !== lastBuild) {
      console.log(`[noah-dev] build #${build} detected — reloading extension`);
      chrome.runtime.sendMessage({ type: "__NOAH_DEV_RELOAD__" });
    }
    lastBuild = build;
  } catch {
    // Dev server not running (production build or server not started yet)
  }
}

setInterval(poll, 1000);
poll();
