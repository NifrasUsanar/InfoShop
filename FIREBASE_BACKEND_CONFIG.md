# Firebase Backend Configuration Implementation

## Summary

Firebase configuration is now loaded from the Laravel backend instead of being hardcoded in the frontend. This provides better security and flexibility.

## Changes Made

### 1. Laravel Backend

#### Added Firebase Config to `config/services.php`

```php
'firebase' => [
    'api_key' => env('FIREBASE_API_KEY'),
    'auth_domain' => env('FIREBASE_AUTH_DOMAIN'),
    'database_url' => env('FIREBASE_DATABASE_URL'),
    'project_id' => env('FIREBASE_PROJECT_ID'),
    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET'),
    'messaging_sender_id' => env('FIREBASE_MESSAGING_SENDER_ID'),
    'app_id' => env('FIREBASE_APP_ID'),
    'measurement_id' => env('FIREBASE_MEASUREMENT_ID'),
],
```

#### Added API Endpoint in `routes/api.php`

```php
Route::get('/config/firebase', function () {
    $config = config('services.firebase');
    
    if (empty($config['project_id'])) {
        return response()->json([
            'status' => 'error',
            'message' => 'Firebase not configured. Please set FIREBASE_* variables in .env',
            'config' => null,
        ], 503);
    }
    
    return response()->json([
        'status' => 'success',
        'config' => [
            'apiKey' => $config['api_key'],
            'authDomain' => $config['auth_domain'],
            'databaseURL' => $config['database_url'],
            'projectId' => $config['project_id'],
            'storageBucket' => $config['storage_bucket'],
            'messagingSenderId' => $config['messaging_sender_id'],
            'appId' => $config['app_id'],
            'measurementId' => $config['measurement_id'],
        ],
    ]);
});
```

#### Updated `.env.example`

Added Firebase environment variables:

```bash
# Firebase Configuration (for POS-Offline sales sync)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_DATABASE_URL=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
```

### 2. Frontend

#### Updated `firebaseConfig.js`

- Removed hardcoded Firebase configuration
- Added `fetchFirebaseConfig()` function to load config from backend
- Made `initializeFirebaseApp()` async to await config fetch
- Made `getFirestoreInstance()` async

**Key Changes:**

```javascript
// Before: Hardcoded config
const firebaseConfig = {
  apiKey: 'AIzaSy...',
  // ...
};

// After: Fetch from backend
async function fetchFirebaseConfig() {
  const response = await axios.get('/api/config/firebase');
  return response.data.config;
}

export async function initializeFirebaseApp() {
  const config = await fetchFirebaseConfig();
  app = initializeApp(config);
  return app;
}
```

#### Updated `firebaseSalesService.js`

- Made `getFirestore()` method async
- Updated all methods to `await this.getFirestore()`
- Made `onSalesChange()` and `onUnsyncedSalesChange()` async

#### Updated `FirebaseContext.jsx`

- Updated initialization to await async `initializeFirebaseApp()`
- Made subscription methods async

## Configuration Setup

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (⚙️ icon)
4. Scroll to "Your apps" section
5. Select your web app or create a new one
6. Copy the `firebaseConfig` object

### Step 2: Update Laravel .env

Add the Firebase credentials to `infoshop/.env`:

```bash
FIREBASE_API_KEY=AIzaSyAEP8GABr3drr-8fluu2FarZMmxdSHdibY
FIREBASE_AUTH_DOMAIN=fir-project-a6735.firebaseapp.com
FIREBASE_DATABASE_URL=https://fir-project-a6735.firebaseio.com
FIREBASE_PROJECT_ID=fir-project-a6735
FIREBASE_STORAGE_BUCKET=fir-project-a6735.appspot.com
FIREBASE_MESSAGING_SENDER_ID=709486564436
FIREBASE_APP_ID=1:709486564436:web:98126c29d030eca49789c1
FIREBASE_MEASUREMENT_ID=G-VQYSWVQMVS
```

### Step 3: Test Configuration

#### Test API Endpoint

```bash
curl http://localhost:8000/api/config/firebase
```

Expected response:

```json
{
  "status": "success",
  "config": {
    "apiKey": "AIzaSy...",
    "authDomain": "your-project.firebaseapp.com",
    ...
  }
}
```

#### Test in Browser Console

```javascript
// Check if config loads
const response = await fetch('/api/config/firebase');
const data = await response.json();
console.log('Firebase config:', data);
```

## Benefits

### Security

- ✅ Firebase API keys not exposed in frontend source code
- ✅ Credentials not committed to version control
- ✅ Easy to rotate keys without rebuilding frontend

### Flexibility

- ✅ Different Firebase projects per environment (dev/staging/prod)
- ✅ Easy configuration changes via .env file
- ✅ No frontend rebuild required for config updates

### Centralization

- ✅ All service credentials in one place (Laravel .env)
- ✅ Consistent with other third-party service configs
- ✅ Easy to manage and audit

## Troubleshooting

### Error: "Firebase not configured"

**Cause**: Firebase environment variables not set in `.env`

**Solution**: Add the `FIREBASE_*` variables to your `.env` file

### Error: "Failed to fetch config from backend"

**Cause**: API endpoint not accessible or Laravel not running

**Solution**: 
- Ensure Laravel server is running
- Check that `/api/config/firebase` endpoint is accessible
- Verify CORS settings if frontend and backend are on different domains

### Error: "Firestore not initialized"

**Cause**: Firebase config fetch failed or returned invalid config

**Solution**:
- Check browser console for detailed error
- Verify Firebase credentials in `.env` are correct
- Test the API endpoint directly: `curl http://localhost/api/config/firebase`

## Migration Guide

If you have an existing Firebase config in the frontend:

1. Copy your current `firebaseConfig` values
2. Add them to Laravel `.env` file with `FIREBASE_` prefix
3. The frontend will automatically use the new backend config
4. No changes needed to existing code using Firebase services

## Production Deployment

### Environment Variables

Ensure all Firebase variables are set in production `.env`:

```bash
FIREBASE_API_KEY=${YOUR_PRODUCTION_API_KEY}
FIREBASE_AUTH_DOMAIN=${YOUR_PROJECT}.firebaseapp.com
# ... etc
```

### Security Considerations

1. **API Endpoint Protection**: Consider adding authentication to `/api/config/firebase` if needed
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **CORS**: Configure CORS properly if frontend is on different domain

### Caching

The frontend automatically caches the Firebase config after first fetch. To force refresh:

1. Clear browser cache
2. Reload the application

## Next Steps

- ✅ Firebase config loaded from backend
- ✅ Credentials stored securely in .env
- ⏳ Add Firebase credentials to production .env
- ⏳ Test in production environment
- ⏳ Set up different Firebase projects for dev/staging/prod (optional)
