@echo off
echo ========================================
echo Build Browser Extension
echo ========================================
echo.

cd /d "%~dp0"

set OUTPUT=shanbay-translate-helper.zip
set TEMP_DIR=shanbay-translate-helper

echo Building extension...

REM Delete old files
if exist "%OUTPUT%" del "%OUTPUT%"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"

REM Create temp directory
mkdir "%TEMP_DIR%"

REM Copy necessary files
echo Copying files...
copy manifest.json "%TEMP_DIR%\" >nul
xcopy src "%TEMP_DIR%\src\" /e /i /q >nul
xcopy icons "%TEMP_DIR%\icons\" /e /i /q >nul

REM Delete debug version
if exist "%TEMP_DIR%\src\content\content-debug.js" del "%TEMP_DIR%\src\content\content-debug.js"

REM Use PowerShell to create zip
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%OUTPUT%' -Force"

REM Clean up temp directory
rmdir /s /q "%TEMP_DIR%"

if exist "%OUTPUT%" (
    echo.
    echo ========================================
    echo Build successful!
    echo.
    echo Output: %OUTPUT%
    echo ========================================
) else (
    echo.
    echo Build failed!
)

echo.
pause
