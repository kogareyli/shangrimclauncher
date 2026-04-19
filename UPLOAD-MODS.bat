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
echo [1/3] Creation de mods.zip depuis .minecraft\mods...
set MODSDIR=C:\Users\atomi\AppData\Roaming\.minecraft\mods
set MODSZIP=%TEMP%\shangrimc-mods.zip

if exist "!MODSZIP!" del "!MODSZIP!"
powershell -Command "Compress-Archive -Path '!MODSDIR!\*' -DestinationPath '!MODSZIP!' -Force"
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
