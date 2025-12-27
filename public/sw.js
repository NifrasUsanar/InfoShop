// Service Worker for InfoShop PWA
// Version: 1.0.0

const CACHE_NAME = 'infoshop-v2';
const OFFLINE_URL = '/offline';

// Assets to precache on install
const PRECACHE_ASSETS = [
    OFFLINE_URL,
    '/Infoshop-icon.png',
    '/css/custom.css',
    '/pos-offline', // PWA start URL - ensure offline POS is always available
    // Add important routes you want available offline immediately
    // Note: These will be cached on first visit, not on SW install
    // To truly precache routes, you'd need to fetch them during install
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets:', PRECACHE_ASSETS);
                // Try to precache, but don't fail if some assets are missing
                return Promise.allSettled(
                    PRECACHE_ASSETS.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('[SW] Failed to cache:', url, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] Precache complete, activating...');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Delete old caches
                            return cacheName !== CACHE_NAME && cacheName.startsWith('infoshop-');
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip service worker in development (when Vite dev server is running)
    // Vite dev server URLs (localhost:5173, @vite, etc.)
    if (url.pathname.includes('@vite') || url.pathname.includes('/@fs/')) {
        return; // Let Vite handle its own requests
    }

    // Skip API calls (handle them separately or let them fail)
    if (url.pathname.startsWith('/api/')) {
        return; // Let API calls go directly to network
    }

    // Skip service worker itself
    if (url.pathname === '/sw.js') {
        return;
    }

    // Only cache /pos-offline routes and its assets (PWA for standalone POS)
    // Skip all other routes to avoid interfering with main infoshop app
    const posOfflineRoutes = [
        '/pos-offline',           // POS offline page
        '/manifest.json',         // PWA manifest
        '/offline',               // Offline fallback page
        '/Infoshop-icon.png',     // App icon
        '/css/custom.css',        // Global CSS
        '/build/',                // Vite-built assets (JS, CSS)
    ];

    const isPosPosOfflineRoute = posOfflineRoutes.some(route =>
        url.pathname === route || url.pathname.startsWith(route)
    );

    if (!isPosPosOfflineRoute) {
        return;
    }

    // Handle Inertia requests (AJAX navigations)
    if (request.headers.get('X-Inertia')) {
        event.respondWith(
            handleInertiaRequest(request)
        );
        return;
    }
    
    // Handle regular requests
    event.respondWith(
        handleRequest(request)
    );
});

/**
 * Handle Inertia AJAX requests
 * Strategy: Network-first, fallback to cache, then redirect to offline page
 */
async function handleInertiaRequest(request) {
    try {
        // Try network first (get latest data)
        const networkResponse = await fetch(request);

        // Cache the response for offline use
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            console.log('[SW] ✅ Inertia: Network success, cached:', request.url);
            return networkResponse;
        } else {
            // Network responded but with error status (404, 500, etc.)
            console.warn('[SW] ⚠️ Inertia: Network error status:', networkResponse.status, 'for', request.url);

            // Try cache instead
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log('[SW] 📦 Inertia: Serving cached version instead');
                return cachedResponse;
            }

            // No cache, return the error response
            console.log('[SW] ❌ Inertia: No cache, returning error response');
            return networkResponse;
        }
    } catch (error) {
        // Network failed completely (offline, CORS, DNS error, etc.)
        console.log('[SW] 🔌 Inertia: Network failed, trying cache:', request.url, error.message);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[SW] ✅ Inertia: Serving from cache');
            return cachedResponse;
        }

        // No cached Inertia response - redirect to offline page as regular navigation
        // This forces a full page load instead of AJAX
        console.log('[SW] ⚠️ Inertia: No cache, redirecting to offline page');
        return Response.redirect(OFFLINE_URL, 302);
    }
}

/**
 * Handle regular requests
 * Strategy: Cache-first for assets, Network-first for HTML
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Static assets (JS, CSS, images, fonts): Cache-first
    if (isStaticAsset(url.pathname)) {
        return cacheFirst(request);
    }
    
    // HTML pages: Network-first
    if (request.headers.get('Accept')?.includes('text/html')) {
        return networkFirst(request);
    }
    
    // Default: Network-first
    return networkFirst(request);
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
    const staticExtensions = [
        '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
        '.woff', '.woff2', '.ttf', '.eot', '.ico'
    ];

    // Also check for Vite build directory
    if (pathname.startsWith('/build/')) {
        return true;
    }

    return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Cache-first strategy with stale-while-revalidate
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Return cached version immediately
        // Update cache in background (stale-while-revalidate)
        fetch(request)
            .then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse);
                    });
                }
            })
            .catch(() => {
                // Ignore fetch errors when offline
            });

        return cachedResponse;
    }

    // Not in cache, fetch from network and cache
    return fetchAndCache(request);
}

/**
 * Network-first strategy
 * For HTML pages - cache both the page AND all its assets
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);

            console.log('[SW] ✅ Network success, cached:', request.url);

            // If it's an HTML response, also cache it for offline use
            const contentType = networkResponse.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                console.log('[SW] HTML page cached, all linked assets will be cached on request');
            }

            return networkResponse;
        } else {
            // Network responded but with error status (404, 500, etc.)
            console.warn('[SW] ⚠️ Network responded with status:', networkResponse.status, 'for', request.url);

            // Try to serve from cache instead of showing error
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log('[SW] 📦 Serving cached version instead of', networkResponse.status);
                return cachedResponse;
            }

            // No cache available, return the error response
            console.log('[SW] ❌ No cache available, returning', networkResponse.status, 'response');
            return networkResponse;
        }
    } catch (error) {
        // Network failed completely (offline, CORS, DNS error, etc.)
        console.log('[SW] 🔌 Network failed (offline?), trying cache:', request.url, error.message);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[SW] ✅ Serving from cache:', request.url);
            return cachedResponse;
        }

        // No cache, show offline page
        console.log('[SW] ⚠️ No cache available, showing offline page');
        return caches.match(OFFLINE_URL);
    }
}

/**
 * Fetch and cache helper
 */
async function fetchAndCache(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            console.log('[SW] Cached:', request.url);
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Fetch failed (offline):', request.url);

        // Try to return offline page
        const offlineResponse = await caches.match(OFFLINE_URL);
        if (offlineResponse) {
            return offlineResponse;
        }

        // Last resort: return error response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain',
            }),
        });
    }
}

// Listen for messages from the page
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
