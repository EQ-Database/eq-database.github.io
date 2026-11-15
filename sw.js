// EuphorbiaQuest Field Database - offline support
// Your plant data is NOT stored here; it stays in the app's storage on your iPhone.
const CACHE = "eqdb-v1";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function fromCache(r) {
  return caches.match(r, {ignoreSearch: true}).then(m => m || caches.match("./index.html"));
}
// Try the network first so updates arrive; if it is slow (3 s) or offline, use the saved copy.
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(new Promise(resolve => {
    let done = false;
    const t = setTimeout(() => { fromCache(r).then(m => { if (m && !done) { done = true; resolve(m); } }); }, 3000);
    fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      if (!done) { done = true; clearTimeout(t); resolve(res); }
    }).catch(() => {
      fromCache(r).then(m => { if (!done) { done = true; clearTimeout(t); resolve(m || Response.error()); } });
    });
  }));
});
