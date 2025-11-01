@echo off
REM Create Update ZIP for InfoShop V2
REM Usage: Run this from the project root directory (infoshop folder)

setlocal enabledelayedexpansion

REM Set output file name
set OUTPUT_FILE=update.zip
set TEMP_DIR=temp_update

REM Create temporary directory
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

REM Copy required folders
echo Copying required folders...
xcopy app %TEMP_DIR%\app /E /I /Y
xcopy routes %TEMP_DIR%\routes /E /I /Y
xcopy resources %TEMP_DIR%\resources /E /I /Y
xcopy config %TEMP_DIR%\config /E /I /Y
xcopy database %TEMP_DIR%\database /E /I /Y
xcopy lang %TEMP_DIR%\lang /E /I /Y

REM Copy optional folders (only if they exist)
if exist public (
    echo Copying public folder...
    xcopy public %TEMP_DIR%\public /E /I /Y

    REM Remove tinymce from public folder
    if exist %TEMP_DIR%\public\tinymce (
        echo Removing tinymce folder...
        rmdir /s /q %TEMP_DIR%\public\tinymce
    )

    REM Remove vendor from public folder
    if exist %TEMP_DIR%\public\vendor (
        echo Removing vendor folder...
        rmdir /s /q %TEMP_DIR%\public\vendor
    )
)

REM Delete existing ZIP if present
if exist %OUTPUT_FILE% del %OUTPUT_FILE%

REM Create ZIP file using PowerShell
echo Creating ZIP file...
powershell -command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%TEMP_DIR%', '%OUTPUT_FILE%')"

REM Clean up temporary directory
echo Cleaning up...
rmdir /s /q %TEMP_DIR%

echo.
echo ✓ Update package created: %OUTPUT_FILE%
echo Total size: 
for /f "delims=" %%a in ('powershell -command "Write-Host ([math]::Round((Get-Item '%OUTPUT_FILE%').Length / 1MB, 2)) MB"') do set SIZE=%%a
echo %SIZE%

pause
