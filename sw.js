const APP_VERSION = "v3";
const CACHE_NAME = `symptom-tracker-${APP_VERSION}`;

const APP_STATIC_RESOURCES = [
    "/index.html",
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

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                for (const url of APP_STATIC_RESOURCES) {
                    const request = new Request(
                        new URL(url, self.location.origin)
                    );
                    const response = await fetch(request);

                    await cache.put(request, response);
                }
            })
            .then(() => self.skipWaiting())
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

            // Tell index.html to refresh the page
            const clientsList = await clients.matchAll();
            for (const client of clientsList) {
                client.postMessage({
                    type: "UPDATED"
                });
            }

        })()
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            caches.match("/index.html")
                .then(response => {
                    return response;
                })
        );
        return;
    }

    
    event.respondWith(
        caches.match(event.request, { ignoreVary: true })
            .then(response => {
                if (response) {
                    return response;
                }

                return new Response("Offline", {
                    status: 503,
                    statusText: "Offline"
                });
            })
    );
});

self.addEventListener("message", (event) => {
    if(event.data?.type === "GET_VERSION") {
        event.source?.postMessage({
            type: "VERSION",
            version: CACHE_NAME
        });
    }
});