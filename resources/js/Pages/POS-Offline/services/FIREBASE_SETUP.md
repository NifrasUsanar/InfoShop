# Firebase Integration Setup Guide

This guide will help you set up Firebase for your POS-Offline system to store sales data in the cloud.

> **📌 Configuration Note**: Firebase credentials are stored in Laravel's `.env` file and loaded automatically from the backend. You don't need to modify any frontend configuration files. See `FIREBASE_BACKEND_CONFIG.md` for technical details.

## Architecture Overview

The hybrid storage architecture works as follows:

- **IndexedDB**: Stores catalog data (Products, Charges, Collections, Contacts) for fast offline access
- **Firebase Firestore**: Stores critical Sales/Transaction data for real-time cloud persistence
- **Laravel Backend**: Ultimate source of truth, syncs with Firebase periodically and serves Firebase config

### Backend Configuration Benefits

Firebase credentials are stored in Laravel's `.env` file and served via API (`/api/config/firebase`). This provides:

✅ **Security**: API keys not exposed in frontend code or version control
✅ **Flexibility**: Easy to change Firebase projects without rebuilding frontend
✅ **Multi-Environment**: Different Firebase projects for dev/staging/production
✅ **Centralized**: All configuration in one place (Laravel .env)

### Why This Approach?

1. **IndexedDB** can be cleared by browsers (privacy mode, storage quota), but it's perfect for catalog data that can be re-synced
2. **Firebase** provides reliable cloud storage with offline support, perfect for sales data that cannot be lost
3. **Laravel** remains the central database, with periodic syncs from Firebase ensuring all data is centralized

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "InfoPOS")
4. Enable/disable Google Analytics (optional)
5. Click "Create project"

### 2. Register Your Web App

1. In your Firebase project, click the **Web** icon (`</>`)
2. Enter an app nickname (e.g., "POS-Offline")
3. **Do NOT** check "Also set up Firebase Hosting" (we're using Laravel)
4. Click "Register app"
5. Copy the `firebaseConfig` object shown on the screen

### 3. Update Laravel Environment Variables

Open `infoshop/.env` and add your Firebase configuration (or copy from `.env.example`):

```bash
# Firebase Configuration (for POS-Offline sales sync)
FIREBASE_API_KEY=YOUR_API_KEY
FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID.firebaseio.com
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_APP_ID
FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

**Important**: Replace the values with your actual Firebase credentials from Step 2.

The frontend will automatically fetch this configuration from the Laravel backend via `/api/config/firebase`.

### 4. Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (we'll configure security rules next)
4. Select a Firestore location (choose the closest to your users)
5. Click "Enable"

### 5. Configure Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sales collection - anyone can read/write (since we're using Laravel auth)
    // In production, you should add proper authentication
    match /sales/{saleId} {
      allow read, write: if true;
    }
  }
}
```

**Important**: These rules allow anyone to read/write sales data. For production, you should:
- Implement Firebase Authentication
- Restrict access based on user authentication
- Use custom claims to match Laravel user permissions

### 6. Enable Offline Persistence (Already Configured)

The Firebase configuration in `firebaseConfig.js` already enables offline persistence:

```javascript
_firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});
```

This means:
- Firebase will cache data locally in IndexedDB
- Changes made offline will sync automatically when online
- Multiple tabs will sync through a single tab manager

## How It Works

### Creating a Sale

When you complete a checkout in the POS:

1. **Sale is saved to Firebase** via `createSale()` in `FirebaseSalesService`
2. The sale is marked as `synced: false`
3. A unique `invoice_number` is generated (e.g., `INV-1234567890-xyz123`)

### Syncing to Laravel

Sales are synced from Firebase to Laravel in two ways:

#### Manual Sync (Recommended for Testing)

You can trigger a manual sync in your code:

```javascript
import { FirebaseToLaravelSync } from './services/firebaseToLaravelSync';

// Sync all unsynced sales
const result = await FirebaseToLaravelSync.syncUnsyncedSales();
console.log(result);
```

#### Automatic Sync (Future Implementation)

You can set up automatic sync in several ways:

1. **Periodic sync** (every X minutes when online)
2. **On connection restore** (when the device comes back online)
3. **Background sync** (using Service Workers)

Example periodic sync:

```javascript
// In your App.jsx or SyncContext
useEffect(() => {
  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      await FirebaseToLaravelSync.syncUnsyncedSales();
    }
  }, SYNC_INTERVAL);

  return () => clearInterval(syncInterval);
}, []);
```

## Testing the Integration

### 1. Test Firebase Configuration Endpoint

Open your browser and navigate to:

```
http://your-laravel-app.test/api/config/firebase
```

You should see a JSON response with your Firebase configuration:

```json
{
  "status": "success",
  "config": {
    "apiKey": "YOUR_API_KEY",
    "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
    ...
  }
}
```

If you see an error, make sure you've added the Firebase environment variables to your `.env` file.

### 2. Test Sale Creation

Complete a sale in the POS and check:

1. **Browser Console**: Look for `[Firebase] Sale created: INV-...`
2. **Firebase Console**: Go to Firestore Database → sales collection → verify the document exists

### 3. Test Sync to Laravel

In browser console:

```javascript
import { FirebaseToLaravelSync } from './services/firebaseToLaravelSync';
const result = await FirebaseToLaravelSync.syncUnsyncedSales();
console.log('Sync result:', result);
```

Then check:

1. **Laravel Database**: Verify the sale exists in the `sales` table
2. **Firebase Console**: Verify the sale document now has `synced: true`

## Monitoring & Debugging

### Firebase Console

Monitor your sales data:

1. Go to **Firestore Database**
2. Click on the **sales** collection
3. View individual documents

### Check Sync Status

```javascript
import { FirebaseToLaravelSync } from './services/firebaseToLaravelSync';

const status = await FirebaseToLaravelSync.getSyncStatus();
console.log('Sync Status:', status);
// {
//   totalSales: 10,
//   unsyncedSales: 3,
//   syncedSales: 7,
//   needsSync: true
// }
```

### Common Issues

1. **"Firestore not initialized"**
   - Check if Firebase config is correct
   - Verify Firebase app is initialized before using Firestore

2. **"Permission denied"**
   - Check Firestore security rules
   - Verify you're using the correct project

3. **"Sync failed"**
   - Check Laravel API endpoint is accessible
   - Verify sale data structure matches Laravel expectations
   - Check browser console for detailed error messages

## Production Considerations

### Security

1. **Firebase Authentication**: Implement Firebase Auth to secure Firestore
2. **Security Rules**: Update Firestore rules to restrict access based on authentication
3. **API Keys**: Consider using environment variables for sensitive config

### Performance

1. **Batch Writes**: Firebase supports batch writes (up to 500 operations)
2. **Indexed Queries**: Create indexes for frequently queried fields
3. **Offline Cache Size**: Monitor IndexedDB usage (default ~40MB)

### Backup & Recovery

1. **Firebase Exports**: Set up automated Firestore exports
2. **Laravel Sync**: Regular syncs ensure Laravel has all data
3. **Point-in-time Recovery**: Enable Firebase backups

## Next Steps

1. ✅ Firebase is now integrated
2. ✅ Sales are saved to Firebase on checkout
3. ✅ Manual sync to Laravel is available
4. ⏳ Implement automatic periodic sync
5. ⏳ Add sync UI in POS (show sync status, manual trigger button)
6. ⏳ Implement Firebase Authentication
7. ⏳ Update Firestore security rules for production

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Web Guide](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Offline Support](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
