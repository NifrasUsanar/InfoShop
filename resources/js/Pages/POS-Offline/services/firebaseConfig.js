import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import axios from 'axios';

// Firebase configuration (loaded from backend)
let firebaseConfig = null;
let configPromise = null;

let app = null;
let _firestore = null;

/**
 * Fetch Firebase configuration from Laravel backend
 * Caches the config to avoid multiple API calls
 */
async function fetchFirebaseConfig() {
  if (firebaseConfig) {
    return firebaseConfig;
  }

  // If already fetching, wait for the existing promise
  if (configPromise) {
    return configPromise;
  }

  configPromise = axios.get('/api/config/firebase')
    .then(response => {
      if (response.data.status === 'success' && response.data.config) {
        firebaseConfig = response.data.config;
        console.log('[Firebase] Config loaded from backend:', {
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
        });
        return firebaseConfig;
      } else {
        throw new Error(response.data.message || 'Failed to load Firebase config');
      }
    })
    .catch(error => {
      console.error('[Firebase] Failed to fetch config from backend:', error.message);
      configPromise = null; // Reset so it can be retried
      throw error;
    });

  return configPromise;
}

/**
 * Initialize Firebase lazily (only when needed)
 * This prevents Firebase from initializing at app startup
 * Fetches configuration from Laravel backend
 */
export async function initializeFirebaseApp() {
  if (app) return app;

  try {
    // Fetch config from backend
    const config = await fetchFirebaseConfig();

    console.log('[Firebase] Initializing with config from backend');
    app = initializeApp(config);
    return app;
  } catch (error) {
    console.warn('[Firebase] Initialization error:', error);
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
  if (firebaseApp) {
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
      console.warn('[Firebase] Error initializing Firestore with persistence:', error.message);

      // Fallback: Try without explicit persistence (uses default settings)
      try {
        const { getFirestore } = require('firebase/firestore');
        _firestore = getFirestore(firebaseApp);
        console.log('[Firebase] Firestore initialized with default settings');
      } catch (fallbackError) {
        console.error('[Firebase] Failed to initialize Firestore:', fallbackError);
      }
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

export { disableNetwork, enableNetwork };

export default app;
