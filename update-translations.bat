@echo off
echo === Chaabik Translation Update Tool ===
echo.
echo Extracting translations from source code...
call npm run extract-translations
echo.
echo Running translation update script...
call node scripts/update-translations.js
echo.
echo === Translation update completed ===