@echo off
REM Create Update ZIP for InfoShop V2 using Git Archive
REM Archives all required folders: app, routes, resources, config, database, lang, public
REM Excludes: public/tinymce, public/vendor
REM Usage: Run from infoshop project root directory

setlocal enabledelayedexpansion

set OUTPUT_FILE=update.zip
set TEMP_DIR=temp_update_files

echo ===== InfoShop V2 Update Package Generator =====
echo.

REM Check if git is available
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git and make sure it is in your system PATH
    pause
    exit /b 1
)

REM Clean up old temp directory
if exist %TEMP_DIR% (
    echo Cleaning up old temporary files...
    rmdir /s /q %TEMP_DIR%
)
mkdir %TEMP_DIR%

echo Creating archive from git...

REM Use git archive to create initial archive
REM This ensures we only get tracked files and the correct structure
git archive -o %TEMP_DIR%\initial.zip HEAD -- app routes resources config database public
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create git archive
    rmdir /s /q %TEMP_DIR%
    pause
    exit /b 1
)

echo Archive created successfully. Size: 
for /f "delims=" %%a in ('powershell -command "Write-Host ([math]::Round((Get-Item '%TEMP_DIR%\initial.zip').Length / 1KB, 2)) KB"') do echo %%a

echo Extracting archive contents...

REM Extract using PowerShell (more reliable on Windows)
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%cd%\%TEMP_DIR%\initial.zip', '%cd%\%TEMP_DIR%\extract')" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to extract archive
    rmdir /s /q %TEMP_DIR%
    pause
    exit /b 1
)

echo Removing excluded folders...

REM Remove excluded folders
if exist %TEMP_DIR%\extract\public\tinymce (
    echo - Removing public/tinymce
    rmdir /s /q %TEMP_DIR%\extract\public\tinymce
)

if exist %TEMP_DIR%\extract\public\vendor (
    echo - Removing public/vendor
    rmdir /s /q %TEMP_DIR%\extract\public\vendor
)

REM Delete existing output ZIP if present
if exist %OUTPUT_FILE% (
    echo Removing old update.zip...
    del /Q %OUTPUT_FILE%
)

echo Creating final update package...

REM Create final ZIP from extracted contents using PowerShell
REM This is more reliable than tar on Windows
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%cd%\%TEMP_DIR%\extract', '%cd%\%OUTPUT_FILE%')" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create final ZIP file
    rmdir /s /q %TEMP_DIR%
    pause
    exit /b 1
)

REM Clean up temporary directory
echo Cleaning up temporary files...
rmdir /s /q %TEMP_DIR%

echo.
if exist %OUTPUT_FILE% (
    echo ===== SUCCESS =====
    for /f "delims=" %%a in ('powershell -command "Write-Host ([math]::Round((Get-Item '%OUTPUT_FILE%').Length / 1MB, 2)) MB"') do set SIZE=%%a
    echo ✓ Update package created: %OUTPUT_FILE%
    echo Size: %SIZE%
    echo.
    echo Ready to upload to /update-v2 or use API endpoint
) else (
    echo ERROR: Failed to create update package
    pause
    exit /b 1
)

echo.
pause
