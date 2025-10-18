const ANIMATION_CACHE = 'lobba-animations-v1'
const STATIC_CACHE = 'lobba-static-v1'

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== ANIMATION_CACHE && cache !== STATIC_CACHE) {
            console.log('Service Worker: Clearing old cache:', cache)
            return caches.delete(cache)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.url.includes('/uploads/users/') && 
      request.url.includes('/animations/')) {
    event.respondWith(
      caches.open(ANIMATION_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache:', request.url)
            return cachedResponse
          }

          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              console.log('Service Worker: Caching new animation:', request.url)
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
        })
      })
    )
  }
})
