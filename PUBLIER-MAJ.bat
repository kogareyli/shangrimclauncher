@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ===================================================
echo   ShangriMc Launcher - Publier une mise a jour
echo ===================================================
echo.
echo Ce script va :
echo   1. Mettre a jour la version dans package.json
echo   2. Committer tous tes changements
echo   3. Creer un tag Git et pousser sur GitHub
echo   4. GitHub Actions build le .exe automatiquement
echo   5. Les joueurs recoivent la MAJ au prochain lancement
echo.

REM -- Lit la version actuelle depuis package.json --
for /f "tokens=2 delims=:, " %%v in ('findstr /c:"\"version\"" package.json') do (
    set CURRENT_VER=%%~v
    goto :got_ver
)
:got_ver
set CURRENT_VER=%CURRENT_VER:"=%

echo Version actuelle dans package.json : %CURRENT_VER%
echo.
set /p NEW_VER=Nouvelle version (appuie Entree pour garder %CURRENT_VER%) :

if "%NEW_VER%"=="" set NEW_VER=%CURRENT_VER%

echo.
echo Version qui sera publiee : v%NEW_VER%
echo.
set /p CONFIRM=Confirmer ? (O/N) :
if /i not "%CONFIRM%"=="O" (
    echo Annule.
    pause
    exit /b 0
)

echo.
echo [1/5] Mise a jour de la version dans package.json...
powershell -Command "(Get-Content package.json -Raw) -replace '\"version\": \"%CURRENT_VER%\"', '\"version\": \"%NEW_VER%\"' | Set-Content package.json -Encoding UTF8 -NoNewline"
echo      OK : %CURRENT_VER% --^> %NEW_VER%

echo.
echo [2/5] Ajout de tous les fichiers modifies...
git add -A
git status --short

echo.
echo [3/5] Commit...
git commit -m "release: version %NEW_VER%"
if errorlevel 1 (
    echo      Rien a committer, fichiers deja a jour.
)

echo.
echo [4/5] Push vers GitHub (branche main)...
git push origin main
if errorlevel 1 (
    echo [ERREUR] Push echoue ! Verifie ta connexion GitHub.
    pause
    exit /b 1
)

echo.
echo [5/5] Creation du tag v%NEW_VER% et push...
git tag -d v%NEW_VER% 2>nul
git tag v%NEW_VER%
git push origin v%NEW_VER%
if errorlevel 1 (
    echo [ERREUR] Push du tag echoue !
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   OK ! Version v%NEW_VER% envoyee sur GitHub !
echo ===================================================
echo.
echo GitHub Actions est en train de builder le launcher...
echo Dans ~5 minutes, la release sera disponible ici :
echo https://github.com/kogareyli/shangrimclauncher/releases
echo.
echo Les joueurs recevront la mise a jour automatiquement
echo au prochain lancement du launcher !
echo.
pause
