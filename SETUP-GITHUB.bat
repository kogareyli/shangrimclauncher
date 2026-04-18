@echo off
chcp 65001 >nul
echo.
echo ===================================================
echo   ShangriMc Launcher - Push initial vers GitHub
echo ===================================================
echo.

git --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Git n'est pas installe !
    echo Telecharge Git sur : https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/4] Configuration du remote GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/kogareyli/shangrimclauncher.git
git branch -M main

echo [2/4] Ajout de tous les fichiers...
git add -A
git commit -m "setup: initial launcher setup" 2>nul

echo [3/4] Push vers GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo Push echoue. Essai avec force push...
    git push -u origin main --force
)

echo.
echo [4/4] Done !
echo.
echo OK - Code en ligne sur :
echo    https://github.com/kogareyli/shangrimclauncher
echo.
echo Pour publier une mise a jour, utilise PUBLIER-MAJ.bat
echo.
pause
