<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - InfoShop</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 24px;
            padding: 60px 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .icon-container {
            width: 120px;
            height: 120px;
            margin: 0 auto 32px;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .icon {
            font-size: 64px;
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
        }
        
        h1 {
            color: #1f2937;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            line-height: 1.2;
        }
        
        p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        
        .btn {
            background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
            color: white;
            border: none;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(30, 136, 229, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: #fef3c7;
            border-radius: 24px;
            font-size: 14px;
            color: #92400e;
            margin-top: 24px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: #f59e0b;
            border-radius: 50%;
            animation: blink 1.5s ease-in-out infinite;
        }
        
        @keyframes blink {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.3;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-container">
            <div class="icon">📡</div>
        </div>
        
        <h1>You're Offline</h1>
        
        <p>
            It looks like you've lost your internet connection. 
            Please check your network settings and try again.
        </p>
        
        <button class="btn" onclick="window.location.reload()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Retry Connection
        </button>
        
        <div class="status">
            <span class="status-dot"></span>
            Waiting for network connection
        </div>
    </div>
    
    <script>
        // Auto-refresh when online
        window.addEventListener('online', () => {
            window.location.reload();
        });
    </script>
</body>
</html>
