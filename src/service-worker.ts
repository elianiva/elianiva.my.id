import { timestamp, build } from "$service-worker"

const CACHE_NAME = `cache-${timestamp}`

console.log("build", build)

// dont' cache images on initial load
const ASSETS = build.filter(file => !/.*\.(png|webp|jpg|)/.test(file))
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)))
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      for (const key of keys) {
        if (!key.includes(timestamp)) caches.delete(key)
      }
    })
  )
})

self.addEventListener("fetch", async event => {
  const { request } = event

  if (request.method !== "GET" || request.headers.has("range")) return

  const url = new URL(request.url)
  const cached = await caches.match(request)

  if (url.origin === location.origin && build.includes(url.pathname)) {
    // always return build files from cache
    event.respondWith(cached)
  } else if (url.protocol === "https:" || location.hostname === "localhost") {
    // hit the network for everything else...
    const promise = fetch(request)

    // ...and cache successful responses...
    promise.then(response => {
      // cache successful responses
      if (response.ok && response.type === "basic") {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, clone)
        })
      }
    })

    // ...but if it fails, fall back to cache if available
    event.respondWith(promise.catch(() => cached || promise))
  }
})
