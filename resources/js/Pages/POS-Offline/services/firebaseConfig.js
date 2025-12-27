import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  getFirestore,
} from 'firebase/firestore';
import axios from 'axios';

// Firebase configuration (loaded from cache or API)
let firebaseConfig = null;
let configPromise = null;

let app = null;
let _firestore = null;

const FIREBASE_CONFIG_STORAGE_KEY = 'firebase_config_cache';

/**
 * Get cached Firebase configuration from localStorage
 */
function getCachedFirebaseConfig() {
  try {
    const cached = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (cached) {
      const config = JSON.parse(cached);
      console.log('[Firebase] Loaded config from localStorage cache');
      return config;
    }
  } catch (error) {
    console.warn('[Firebase] Failed to read cached config:', error.message);
  }
  return null;
}

/**
 * Save Firebase configuration to localStorage for offline persistence
 */
function cacheFirebaseConfig(config) {
  try {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    console.log('[Firebase] Config cached to localStorage');
  } catch (error) {
    console.warn('[Firebase] Failed to cache config to localStorage:', error.message);
  }
}

/**
 * Fetch Firebase configuration from Laravel backend and cache it
 * Returns cached config immediately if available, fetches fresh version in background
 */
async function getFirebaseConfig() {
  // Return cached config immediately if available
  if (firebaseConfig) {
    return firebaseConfig;
  }

  const cachedConfig = getCachedFirebaseConfig();
  if (cachedConfig) {
    firebaseConfig = cachedConfig;
    // Fetch fresh config in background (fire and forget)
    fetchAndCacheFirebaseConfig().catch(err => {
      console.warn('[Firebase] Background config fetch failed, using cached:', err.message);
    });
    return cachedConfig;
  }

  // No cache, must fetch (blocking)
  return fetchAndCacheFirebaseConfig();
}

/**
 * Fetch Firebase configuration from backend and cache it
 */
async function fetchAndCacheFirebaseConfig() {
  // If offline, skip API call and try cache immediately
  if (!navigator.onLine) {
    console.log('[Firebase] Offline detected, checking cache...');
    const cachedConfig = getCachedFirebaseConfig();
    if (cachedConfig) {
      firebaseConfig = cachedConfig;
      return cachedConfig;
    }
    throw new Error('Firebase config not available (offline and no cached config)');
  }

  try {
    console.log('[Firebase] Fetching config from backend...');
    const response = await axios.get('/api/config/firebase', {
      timeout: 5000
    });

    if (response.data.status === 'success' && response.data.config) {
      firebaseConfig = response.data.config;
      cacheFirebaseConfig(firebaseConfig);
      console.log('[Firebase] Config fetched and cached:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
      });
      return firebaseConfig;
    } else {
      throw new Error(response.data.message || 'Invalid Firebase config response');
    }
  } catch (error) {
    console.error('[Firebase] Failed to fetch config from backend:', error.message);

    // Fallback to cached config
    const cachedConfig = getCachedFirebaseConfig();
    if (cachedConfig) {
      firebaseConfig = cachedConfig;
      console.log('[Firebase] Using cached config as fallback');
      return cachedConfig;
    }

    throw new Error('Firebase config not available (offline and no cached config)');
  }
}

/**
 * Initialize Firebase lazily (only when needed)
 * Uses cached config if available (instant), fetches fresh config in background
 */
export async function initializeFirebaseApp() {
  if (app) return app;

  try {
    const config = await getFirebaseConfig();

    console.log('[Firebase] Initializing with cached config');
    app = initializeApp(config);
    return app;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    return null;
  }
}

/**
 * Get Firestore instance with offline persistence enabled
 * Uses IndexedDB for web browsers
 */
export async function getFirestoreInstance() {
  if (_firestore) return _firestore;

  const firebaseApp = await initializeFirebaseApp();
  if (!firebaseApp) return null;

  try {
    console.log('[Firebase] Initializing Firestore with offline persistence...');

    // Initialize Firestore with persistence for web
    _firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager()
      })
    });

    console.log('[Firebase] Firestore initialized with persistent local cache');
  } catch (error) {
    // Check if already initialized (this is expected on page refresh)
    if (error.message?.includes('initializeFirestore() has already been called')) {
      console.log('[Firebase] Firestore already initialized, getting existing instance');
      _firestore = getFirestore(firebaseApp);
    } else {
      console.error('[Firebase] Error initializing Firestore:', error.message);
    }
  }

  return _firestore;
}

// Lazy export - only initialized when explicitly called
// Note: This returns a Promise now since we fetch config from backend
export const firestore = {
  get instance() {
    return getFirestoreInstance();
  }
};

// Auth stub for compatibility (we use Laravel auth, not Firebase auth)
export const auth = {
  currentUser: null,
};

export default app;
