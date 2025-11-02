@echo off
REM Create Update ZIP for InfoShop V2 using Git Archive
REM Archives all required folders: app, routes, resources, config, database, lang, public
REM Excludes: public/tinymce, public/vendor
REM Usage: Run from infoshop project root directory

setlocal enabledelayedexpansion

set OUTPUT_FILE=update.zip
set TEMP_DIR=temp_update

REM Check if git is available
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed or not in PATH
    pause
    exit /b 1
)

REM Clean up old temp directory
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

echo Archiving required folders from git...

REM Archive all required folders in one command
git archive -o %TEMP_DIR%\temp.zip HEAD -- app routes resources config database lang public

REM Check if archive was created successfully
if not exist %TEMP_DIR%\temp.zip (
    echo ERROR: Failed to create git archive
    pause
    exit /b 1
)

echo Archive created. Extracting...

REM Extract archive using tar (built-in to Windows 10+)
tar -xf %TEMP_DIR%\temp.zip -C %TEMP_DIR%

REM If tar fails, try using 7-Zip or other method
if %ERRORLEVEL% NEQ 0 (
    echo Trying alternative extraction method...
    powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%cd%\%TEMP_DIR%\temp.zip', '%cd%\%TEMP_DIR%\')"
)

REM Remove temporary archive
del %TEMP_DIR%\temp.zip

REM Remove excluded folders
echo Removing excluded folders...
if exist %TEMP_DIR%\public\tinymce (
    echo Removing tinymce folder...
    rmdir /s /q %TEMP_DIR%\public\tinymce
)

if exist %TEMP_DIR%\public\vendor (
    echo Removing vendor folder...
    rmdir /s /q %TEMP_DIR%\public\vendor
)

REM Delete existing ZIP if present
if exist %OUTPUT_FILE% del /Q %OUTPUT_FILE%

REM Create final ZIP - use tar or 7z if available, fallback to powershell
echo Creating final ZIP file...

REM Try using 7-Zip (if installed)
7z a -tzip -mx=7 %OUTPUT_FILE% %TEMP_DIR%\* >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating ZIP using tar...
    REM Use tar to create the final zip
    cd %TEMP_DIR%
    tar -acf ..\%OUTPUT_FILE% *
    cd ..
)

if %ERRORLEVEL% NEQ 0 (
    echo Creating ZIP using PowerShell...
    powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%OUTPUT_FILE%' -Force"
)

REM Clean up
echo Cleaning up...
timeout /t 1 /nobreak
rmdir /s /q %TEMP_DIR%

echo.
if exist %OUTPUT_FILE% (
    echo ✓ Update package created: %OUTPUT_FILE%
    for /f "delims=" %%a in ('powershell -command "Write-Host ([math]::Round((Get-Item '%OUTPUT_FILE%').Length / 1MB, 2)) MB"') do set SIZE=%%a
    echo Size: %SIZE%
) else (
    echo ERROR: Failed to create update package
)

pause
