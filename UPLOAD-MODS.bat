@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ===================================================
echo   ShangriMc - Upload fichiers vers GitHub
echo ===================================================
echo.

set /p TOKEN=Token GitHub (ghp_...) :
if "!TOKEN!"=="" ( echo Token vide. & pause & exit /b 1 )

echo.
echo [1/3] Creation de mods.zip (mods + config FancyMenu)...
set MODSDIR=C:\Users\atomi\AppData\Roaming\.minecraft\mods
set CONFIGSRC=%~dp0config
set MODSZIP=%TEMP%\shangrimc-mods.zip

if exist "!MODSZIP!" del "!MODSZIP!"

REM Cree un dossier temporaire avec la structure mods + config
set TMPDIR=%TEMP%\shangrimc_build
if exist "!TMPDIR!" rmdir /s /q "!TMPDIR!"
mkdir "!TMPDIR!"

REM Copie les mods dans le dossier temporaire (a la racine du zip)
xcopy /q /y "!MODSDIR!\*.jar" "!TMPDIR!\" >nul
if errorlevel 1 ( echo [ERREUR] Impossible de copier les mods. & pause & exit /b 1 )

REM Copie le dossier config (layouts FancyMenu) dans le dossier temporaire
if exist "!CONFIGSRC!" (
    xcopy /q /y /e /i "!CONFIGSRC!" "!TMPDIR!\config\" >nul
    echo      Layouts FancyMenu inclus dans le zip
) else (
    echo      [AVERTISSEMENT] Dossier config non trouve, layouts FancyMenu non inclus
)

REM Cree le zip depuis le dossier temporaire
powershell -Command "Compress-Archive -Path '!TMPDIR!\*' -DestinationPath '!MODSZIP!' -Force"
rmdir /s /q "!TMPDIR!"

if not exist "!MODSZIP!" (
    echo [ERREUR] Impossible de creer mods.zip
    pause
    exit /b 1
)
echo      OK : !MODSZIP!

echo.
echo [2/3] Upload de tous les fichiers vers GitHub...
echo.

node upload-mods.js "!TOKEN!" "!MODSZIP!" "C:\Users\atomi\AppData\Roaming\.minecraft\shaderpacks\BSL_v8.4.zip" "C:\Users\atomi\AppData\Roaming\.minecraft\shaderpacks\ComplementaryReimagined_r5.7.1.zip" "C:\Users\atomi\AppData\Roaming\.minecraft\resourcepacks\DetailedAnimationsReworked - V1.15.zip" "C:\Users\atomi\AppData\Roaming\.minecraft\resourcepacks\Enhanced Audio r6.zip" "C:\Users\atomi\AppData\Roaming\.minecraft\resourcepacks\Fresh Skeleton Physics.zip" "C:\Users\atomi\AppData\Roaming\.minecraft\resourcepacks\Nature X - 12.2 [1.20.1].zip" "C:\Users\atomi\AppData\Roaming\.minecraft\resourcepacks\Nautilus3D_V1.9_[MC-1.13+].zip"

echo.
echo [3/3] Nettoyage...
del "!MODSZIP!" 2>nul

echo.
pause
