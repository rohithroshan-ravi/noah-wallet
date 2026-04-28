const injected = document.createElement("script");
injected.src = chrome.runtime.getURL("inpage.js");
injected.onload = () => injected.remove();
(document.head || document.documentElement).appendChild(injected);

window.addEventListener("message", async (event) => {
  if (event.source !== window || !event.data) return;
  if (event.data.target !== "NOAH_CONTENT" || !event.data.payload) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "NOAH_PROVIDER_REQUEST",
      payload: event.data.payload
    });

    window.postMessage(
      {
        target: "NOAH_INPAGE",
        response,
        id: event.data.payload.id
      },
      "*"
    );
  } catch (error) {
    window.postMessage(
      {
        target: "NOAH_INPAGE",
        id: event.data.payload.id,
        error: { message: error instanceof Error ? error.message : "Provider bridge failed" }
      },
      "*"
    );
  }
});
