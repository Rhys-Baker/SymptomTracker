const VERSION = "v1";
const CACHE_NAME = `symptom-tracker-${VERSION}`;

const APP_STATIC_RESOURCES = [
    "/",
    "/index.html",
    "/sw.js",
    "/js/app.js",
    "/js/router.js",
    "/js/db.js",
    "/js/views/history.js",
    "/js/views/home.js",
    "/js/views/symptoms.js",
    "/css/style.css",
    "/icon-512.png",
    "/manifest.json"
];

self.addEventListener("install", (e) => {
    e.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            for (const url of APP_STATIC_RESOURCES) {
                try {
                    console.log("Caching", url);
                    await cache.add(url);
                } catch (err) {
                    console.error("Failed:", url, err);
                }
            }
            await self.skipWaiting();
        })(),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
            await clients.claim();
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    // When seeking an HTML page
    if (event.request.mode === "navigate") {
        // Return to the index.html page
        event.respondWith(caches.match("/"));
        return;
    }

    // For every other request type
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request.url);
            if (cachedResponse) {
                // Return the caches response if it's available
                return cachedResponse;
            }
            console.error(`Failed to fetch required file: ${event.request.url}. Preventing load.`);
            // Respond with an HTTP 404 response status.
            return new Response(null, { status: 404 });
        })(),
    );
});
