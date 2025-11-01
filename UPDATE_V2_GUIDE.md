# Infoshop V2 Update System Guide

## Overview

The V2 update system provides a migration-based approach to updating your Infoshop installation with enhanced safety features, automatic backups, and rollback capabilities.

## Key Features

✅ **Migration-Based Updates** - Uses Laravel migrations instead of raw SQL files  
✅ **Automatic Backups** - Creates backups before applying updates  
✅ **Rollback Support** - Automatically restores from backup if update fails  
✅ **Pre-flight Checks** - Validates environment before starting update  
✅ **Maintenance Mode** - Automatically enables maintenance mode during update  
✅ **Manifest Validation** - Checks version compatibility and requirements  
✅ **Detailed Logging** - All operations logged to storage/logs/laravel.log  

## Update Package Structure

Your update ZIP file should have the following structure:

```
update-package.zip
├── manifest.json          # Version info and requirements (recommended)
├── app/                   # Application core files
├── bootstrap/             # Bootstrap files
├── config/                # Configuration files
├── database/
│   └── migrations/        # New migration files
├── public/
│   ├── build/            # Compiled frontend assets
│   └── ...               # Other public assets
├── resources/             # Views, JS, CSS source files
└── routes/                # Route definitions
```

### Important Notes:

- **Do NOT include** the `vendor/` folder in updates for shared hosting (unless you've bundled dependencies)
- **Do NOT include** `.env` file or sensitive configuration
- **Do NOT include** `storage/` folder
- Migration files in `database/migrations/` will be automatically copied and executed

## Manifest File (manifest.json)

The manifest file is optional but recommended for version validation:

```json
{
  "version": "2.0.0",
  "from_version": "1.9.0",
  "release_date": "2024-01-15",
  "required_php_version": "8.1.0",
  "required_laravel_version": "11.0",
  "description": "Major feature update",
  "migrations": [
    "2025_01_15_000100_add_new_feature.php"
  ],
  "warnings": [
    "This update requires at least 100MB free disk space"
  ]
}
```

See `manifest.example.json` for a complete example.

## How to Use

### Option 1: Web Interface (Recommended for Shared Hosting)

1. Log in to your Infoshop admin panel
2. Navigate to **Settings > Update V2** (or directly to `/update-v2`)
3. Select your update ZIP file
4. Click "Start Update" button
5. Monitor the real-time logs as the system:
   - Validates the package
   - Runs pre-flight checks
   - Creates automatic backup
   - Enables maintenance mode
   - Extracts and copies files
   - Runs database migrations
   - Clears application caches
   - Disables maintenance mode

The V2 interface features:
- Real-time progress bar showing upload and processing status
- Live log display with color-coded messages (info, success, warning, error)
- Automatic rollback display if update fails
- Modern minimalist flat design interface

6. The system will:
   - Validate the package
   - Enable maintenance mode
   - Create automatic backup
   - Copy files
   - Run migrations
   - Clear caches
   - Disable maintenance mode

### Option 2: API Endpoint (For Automated Updates)

**Endpoint:** `POST /api/application-update-v2`

**Headers:**
```
Content-Type: multipart/form-data
```

**Parameters:**
- `zip_file` (required): The update package ZIP file
- `update_token` (required): Your UPDATE_TOKEN from .env file

**Example using cURL:**
```bash
curl -X POST https://your-domain.com/api/application-update-v2 \
  -F "zip_file=@update-package.zip" \
  -F "update_token=your-secret-token"
```

**Response (Success):**
```json
{
  "success": "Application upgraded successfully using V2 process.",
  "migrations_output": "Migration output details..."
}
```

**Response (Error):**
```json
{
  "error": "Upgrade failed: [error message]",
  "details": "Detailed error trace..."
}
```

## Pre-flight Checks

Before applying the update, the system automatically checks:

1. ✅ **Disk Space** - At least 100MB free space required
2. ✅ **Write Permissions** - All critical folders must be writable
3. ✅ **Database Connection** - Database must be accessible
4. ✅ **PHP Version** - If specified in manifest.json
5. ✅ **Laravel Version** - If specified in manifest.json

If any check fails, the update will not proceed.

## Backup & Rollback

### Automatic Backup

Before applying updates, the system creates backups of:
- `app/` folder
- `config/` folder  
- `database/migrations/` folder

Backups are stored in: `storage/app/backups/YYYY-MM-DD_HHMMSS/`

### Automatic Rollback

If the update fails at any stage:
1. The system automatically restores files from the backup
2. Maintenance mode is disabled
3. Error details are logged to `storage/logs/laravel.log`

### Manual Rollback

If needed, you can manually restore from backup:
1. Navigate to `storage/app/backups/`
2. Find the backup folder (dated timestamp)
3. Copy folders back to the application root
4. Run: `php artisan up` to disable maintenance mode

## Migration Handling

### How Migrations Work in V2

1. Migration files from the ZIP are copied to `database/migrations/`
2. Existing migration files are NOT overwritten (duplicates skipped)
3. Migrations are executed using: `php artisan migrate --force`
4. Migration output is captured and returned in the API response

### Migration Best Practices

- Use timestamped migration filenames (Laravel standard)
- Include rollback logic in `down()` methods
- Test migrations on a staging environment first
- Keep migrations atomic (one logical change per file)

## Logs and Debugging

All update operations are logged to: `storage/logs/laravel.log`

**Log entries include:**
- Pre-flight check results
- File copy operations
- Migration execution details
- Cache clearing results
- Errors and exceptions

**To view logs:**
```bash
tail -f storage/logs/laravel.log
```

## Troubleshooting

### Update Stuck in Maintenance Mode

```bash
php artisan up
```

Or create a file: `storage/framework/down` and delete it.

### Migrations Failed

1. Check `storage/logs/laravel.log` for migration errors
2. Manually fix database issues
3. Run migrations manually: `php artisan migrate --force`
4. Disable maintenance mode: `php artisan up`

### Files Not Updated

- Check folder write permissions (must be writable)
- Verify ZIP structure matches expected format
- Check `storage/logs/laravel.log` for copy errors

### Rollback Failed

- Navigate to `storage/app/backups/[timestamp]/`
- Manually copy folders back to application root
- Run `php artisan up`

## Security Considerations

### UPDATE_TOKEN

Set a strong update token in your `.env` file:

```env
UPDATE_TOKEN=your-random-secret-token-here
```

This prevents unauthorized updates via the API endpoint.

### File Permissions

Ensure proper file permissions on shared hosting:
- Folders: `755` (drwxr-xr-x)
- Files: `644` (-rw-r--r--)
- PHP files: `644` (-rw-r--r--)

### HTTPS Required

Always use HTTPS when uploading updates to prevent man-in-the-middle attacks.

## Differences from V1 Update System

| Feature | V1 | V2 |
|---------|----|----|
| Update Method | Raw SQL file | Laravel Migrations |
| Backup | None | Automatic |
| Rollback | Manual | Automatic |
| Pre-flight Checks | None | Yes |
| Maintenance Mode | Manual | Automatic |
| Manifest Validation | No | Yes (optional) |
| Cache Clearing | Commented out | Automatic |
| Error Handling | Basic | Comprehensive |

## Best Practices

1. ✅ **Always test updates on a staging environment first**
2. ✅ **Create manual database backup before major updates**
3. ✅ **Include manifest.json with version requirements**
4. ✅ **Use descriptive migration filenames**
5. ✅ **Monitor logs during and after update**
6. ✅ **Keep UPDATE_TOKEN secret and secure**
7. ✅ **Verify disk space before updating**
8. ✅ **Schedule updates during low-traffic periods**

## Compatibility

- **Laravel:** 11.x
- **PHP:** 8.1 or higher
- **Hosting:** Shared hosting compatible (no CLI access required)
- **Database:** MySQL 5.7+, MariaDB 10.3+

## Support

If you encounter issues:
1. Check `storage/logs/laravel.log`
2. Verify pre-flight requirements
3. Ensure proper file permissions
4. Contact support with log details

---

**Note:** The legacy V1 update system (`/api/application-update`) remains available for backward compatibility but is not recommended for new deployments.
