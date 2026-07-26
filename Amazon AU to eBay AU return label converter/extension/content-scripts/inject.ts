// Injection script running in the MAIN world to set CSP-safe window flags on the web app page
try {
  const win = window as unknown as { __CP_BOT_ACTIVE__?: boolean; __CP_BOT_VERSION__?: string };
  win.__CP_BOT_ACTIVE__ = true;
  Object.defineProperty(window, "__CP_BOT_VERSION__", {
    get() {
      return document.documentElement.getAttribute("data-cp-bot-version") || "1.0.0";
    },
    configurable: true,
    enumerable: true,
  });
} catch {
  // Silence errors
}
export {};
