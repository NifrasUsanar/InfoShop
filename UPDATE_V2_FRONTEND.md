# Update V2 Frontend Documentation

## Overview

The Update V2 interface provides a modern, user-friendly way to update your Infoshop installation with real-time feedback and progress tracking.

## Features

### 🎨 Minimalist Flat Design
- Clean, modern interface using TailwindCSS
- No shadows or 3D effects - pure flat design
- Responsive layout that works on all screen sizes
- Lucide React icons for crisp, scalable graphics

### 📊 Real-Time Progress Tracking
- **Upload Progress Bar**: Visual indication of file upload progress (0-100%)
- **Processing Indicator**: Animated loader during server-side processing
- **Status Updates**: Clear status messages for each stage:
  - `idle` - Ready to upload
  - `validating` - Checking file validity
  - `uploading` - Uploading to server
  - `processing` - Server processing update
  - `success` - Update completed
  - `error` - Update failed with rollback

### 📝 Live Logs Display
- **Color-Coded Messages**:
  - 🔵 Info (gray) - General information
  - ✅ Success (green) - Successful operations
  - ⚠️ Warning (yellow) - Important notices
  - ❌ Error (red) - Errors and failures
- **Timestamps**: Each log entry includes precise timestamp
- **Auto-Scroll**: Automatically scrolls to newest log entries
- **Scrollable Container**: View up to 96 lines of logs with smooth scrolling
- **Terminal-Style Display**: Black background with monospace font for technical feel

### 🎯 Smart Features

#### Information Cards
Four status cards at the top showing key features:
1. **Migration Based** - Auto updates via Laravel migrations
2. **Auto Backup** - Safe updates with automatic backup
3. **Smart Rollback** - Fail-safe rollback on errors
4. **Pre-flight Checks** - Validated before processing

#### Drag & Drop Upload
- Drag and drop zone for easy file selection
- Click to browse file selector as alternative
- Visual feedback on drag hover
- Only accepts ZIP files
- Shows file name and size after selection

#### Error Handling
- Clear error messages displayed prominently
- Red alert box with error icon
- Detailed error information when available
- Automatic rollback notification on failure

#### Help Section
- Pre-update checklist displayed at bottom
- Important notes about the update process
- Requirements and warnings clearly listed

## Access

**URL**: `/update-v2`

**Navigation**: Settings > Update V2 (from admin panel)

## Usage Flow

### 1. Select File
```
Drag and drop update ZIP file
OR
Click the dropzone to browse and select file
```

### 2. Review Selection
```
File name and size displayed
Option to remove and choose different file
```

### 3. Start Update
```
Click "Start Update" button
Progress bar shows upload progress
Logs display real-time operations
```

### 4. Monitor Progress
```
Watch logs for detailed progress:
- Validation
- Pre-flight checks
- Backup creation
- File extraction
- Migration execution
- Cache clearing
```

### 5. Completion
```
SUCCESS: Green success message with option to upload another
ERROR: Red error message with "Try Again" button
```

## Interface States

### Idle State
- Empty dropzone ready for file selection
- Upload icon displayed
- Help text visible

### File Selected State
- File archive icon displayed
- File name and size shown
- "Start Update" and "Cancel" buttons visible
- No progress bar yet

### Uploading State
- Progress bar showing upload percentage
- "Uploading... X%" status text
- Logs begin showing operations
- Cancel button disabled

### Processing State
- Progress bar at 100% with animated loader
- "Processing update..." status text
- Detailed logs showing each operation
- All controls disabled

### Success State
- Green success indicator
- Complete log history
- "Upload Another Update" button
- Option to clear logs

### Error State
- Red error alert displayed
- Error details in logs
- Rollback messages shown
- "Try Again" button enabled

## Technical Details

### Dependencies
- **React** - UI framework
- **Inertia.js** - Server-side routing
- **Axios** - HTTP client with upload progress
- **react-dropzone** - Drag and drop functionality
- **lucide-react** - Icon library
- **TailwindCSS** - Utility-first styling

### API Endpoint
**POST** `/upload-v2`

**Request**:
- `Content-Type: multipart/form-data`
- `zip_file`: File object

**Response (Success)**:
```json
{
  "success": "Application upgraded successfully using V2 process.",
  "migrations_output": "Migration command output..."
}
```

**Response (Error)**:
```json
{
  "error": "Upgrade failed: [error message]",
  "details": "Detailed error trace..."
}
```

### Log Types
```javascript
addLog(message, 'info')    // Gray text
addLog(message, 'success') // Green text
addLog(message, 'warning') // Yellow text
addLog(message, 'error')   // Red text
```

## Styling Guidelines

### Colors
- **Primary (Blue)**: `#2563eb` - Actions, progress
- **Success (Green)**: `#16a34a` - Success states
- **Warning (Yellow/Orange)**: `#f59e0b` - Warnings
- **Error (Red)**: `#dc2626` - Errors
- **Gray Scale**: For text and borders

### Typography
- **Headers**: `text-lg font-semibold` (18px)
- **Body**: `text-sm` (14px)
- **Labels**: `text-xs` (12px)
- **Logs**: `text-xs font-mono` (12px monospace)

### Spacing
- **Card Padding**: `p-4` to `p-6` (16-24px)
- **Gap**: `gap-3` (12px)
- **Rounded Corners**: `rounded-lg` (8px)

### Components
- **Buttons**: `py-2.5 px-4` with rounded corners
- **Cards**: White background with gray border
- **Icons**: Standard size 16-20px (`w-4 h-4` to `w-5 h-5`)
- **Progress Bar**: 8px height (`h-2`)

## Accessibility

- Semantic HTML structure
- Proper ARIA labels on interactive elements
- Keyboard navigation support via react-dropzone
- Clear visual feedback for all states
- Color is not the only indicator (icons + text)

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements for future versions:

1. **Pause/Resume Upload** - For very large files
2. **Estimated Time Remaining** - Based on upload speed
3. **Download Update Packages** - Direct from vendor
4. **Scheduled Updates** - Schedule updates for specific time
5. **Email Notifications** - Send email on completion
6. **Update History** - View previous updates log
7. **Dry Run Mode** - Simulate update without applying
8. **Manifest Preview** - Show manifest.json contents before upload

## Troubleshooting

### Upload Progress Stuck
- Check browser console for errors
- Verify server is responding
- Check PHP `upload_max_filesize` and `post_max_size` settings
- Ensure stable internet connection

### No Logs Appearing
- Open browser developer tools
- Check Network tab for response
- Verify `/upload-v2` endpoint is accessible
- Check Laravel logs in `storage/logs/laravel.log`

### Layout Issues
- Clear browser cache
- Hard refresh (Ctrl+F5 / Cmd+Shift+R)
- Verify TailwindCSS is compiled
- Check for CSS conflicts

## Support

For issues or questions:
1. Check browser console for JavaScript errors
2. Review `storage/logs/laravel.log` on server
3. Verify all dependencies are installed
4. Contact support with error details and logs

---

**Version**: 2.0.0  
**Last Updated**: 2024-01-15  
**Framework**: Laravel 11.x + React + Inertia.js
