@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ===================================================
echo   ShangriMc Launcher - Publier une mise a jour
echo ===================================================
echo.

REM -- Lit la version actuelle via Node.js --
for /f %%v in ('node -e "process.stdout.write(require('./package.json').version)"') do set CURRENT_VER=%%v

echo Version actuelle : %CURRENT_VER%
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
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='%NEW_VER%';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n','utf8');"
echo      OK : %CURRENT_VER% -^> %NEW_VER%

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
    echo [ERREUR] Push echoue.
    pause
    exit /b 1
)

echo.
echo [5/5] Suppression ancien tag et push du nouveau...
git tag -d v%NEW_VER% 2>nul
git push origin --delete v%NEW_VER% 2>nul
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
echo GitHub Actions build le launcher, ~5 minutes...
echo https://github.com/kogareyli/shangrimclauncher/releases
echo.
echo Les joueurs recevront la MAJ au prochain lancement !
echo.
pause
