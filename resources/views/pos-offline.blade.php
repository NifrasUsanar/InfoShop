<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>POS Offline - Standalone</title>
  
  <!-- PWA Meta -->
  <meta name="theme-color" content="#1e88e5">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/Infoshop-icon.png">
  
  <!-- Vite React Refresh -->
  @viteReactRefresh
  
  <!-- Load standalone app bundle -->
  @vite(['resources/js/Pages/POS-Offline/main.jsx'])
</head>
<body>
  <div id="root"></div>
  
  <!-- Optional: Inject initial data if user is logged in -->
  @auth
  <script>
    window.__INITIAL_USER__ = {
      id: {{ auth()->id() }},
      store_id: {{ auth()->user()->store_id ?? 1 }},
      name: '{{ auth()->user()->name }}',
    };
  </script>
  @endauth

  <!-- Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }
  </script>
</body>
</html>
