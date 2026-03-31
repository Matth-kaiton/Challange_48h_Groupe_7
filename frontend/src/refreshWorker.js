const INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  postMessage({ type: "refresh" });
}, INTERVAL_MS);