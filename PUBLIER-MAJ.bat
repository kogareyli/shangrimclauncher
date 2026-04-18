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
echo Quelle version veux-tu publier ?
echo Exemples : 1.1.1  /  1.2.0  /  2.0.0
echo.
set NEW_VER=
set /p NEW_VER=Nouvelle version :

if "!NEW_VER!"=="" (
    echo Aucune version saisie, annule.
    pause
    exit /b 0
)

echo.
echo  %CURRENT_VER%  -^>  !NEW_VER!
echo.
set CONFIRM=
set /p CONFIRM=Confirmer ? (O/N) :
if /i not "!CONFIRM!"=="O" (
    echo Annule.
    pause
    exit /b 0
)

echo.
echo [1/5] Mise a jour version dans package.json...
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='!NEW_VER!';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n','utf8');"
echo      OK

echo.
echo [2/5] Ajout de tous les fichiers...
git add -A
git status --short

echo.
echo [3/5] Commit...
git commit -m "release: v!NEW_VER!"
if errorlevel 1 echo      (rien a committer)

echo.
echo [4/5] Push branche main...
git push origin main
if errorlevel 1 (
    echo [ERREUR] Push echoue.
    pause
    exit /b 1
)

echo.
echo [5/5] Suppression ancien tag + push nouveau tag...
git tag -d v!NEW_VER! 2>nul
git push origin --delete v!NEW_VER! 2>nul
git tag v!NEW_VER!
git push origin v!NEW_VER!
if errorlevel 1 (
    echo [ERREUR] Push du tag echoue.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   OK ! v!NEW_VER! envoyee sur GitHub !
echo ===================================================
echo.
echo Build en cours sur GitHub Actions (~5 min) :
echo https://github.com/kogareyli/shangrimclauncher/actions
echo.
echo Release disponible ici apres le build :
echo https://github.com/kogareyli/shangrimclauncher/releases
echo.
pause
