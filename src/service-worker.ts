import { timestamp, build } from "$service-worker"

const CACHE_NAME = `cache-${timestamp}`

// dont' cache images on initial load
const ASSETS = build.filter(file => !/.*\.(png|webp|jpg|)/.test(file))

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)))
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      for (const key of keys) {
        if (!key.includes(timestamp.toString())) caches.delete(key)
      }
    })
  )
})

self.addEventListener("fetch", async event => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(event.request)

      if (cachedResponse) return cachedResponse

      const networkResponse = await fetch(event.request)
      event.waitUntil(cache.put(event.request, networkResponse.clone()))

      return networkResponse
    })()
  )
})
