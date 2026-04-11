@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════
echo   ShangriMc Launcher — Push vers GitHub
echo ═══════════════════════════════════════════════════════
echo.

REM ── Vérifie que git est installé ──
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Git n'est pas installé !
    echo Télécharge Git sur : https://git-scm.com/download/win
    pause
    exit /b 1
)

REM ── Vérifie que GitHub CLI est installé ──
gh --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] GitHub CLI n'est pas installé !
    echo Télécharge GitHub CLI sur : https://cli.github.com/
    echo Après installation, lance : gh auth login
    pause
    exit /b 1
)

echo [1/5] Connexion GitHub...
gh auth status >nul 2>&1
if errorlevel 1 (
    echo Connexion à GitHub requise...
    gh auth login
)

echo [2/5] Initialisation du dépôt Git...
git init
git add .
git commit -m "🚀 Initial commit — ShangriMc Launcher v1.0.0"

echo [3/5] Création du repo GitHub "shangrimclauncher"...
gh repo create shangrimclauncher --public --description "ShangriMc Official Minecraft Launcher — Forge 1.20.1" --source . --remote origin --push

if errorlevel 1 (
    echo.
    echo Le repo existe peut-être déjà. Tentative de push direct...
    git remote add origin https://github.com/eddyzaz38/shangrimclauncher.git 2>nul
    git branch -M main
    git push -u origin main
)

echo.
echo [4/5] Configuration des GitHub Actions (build auto)...
mkdir .github\workflows 2>nul

echo [5/5] Push terminé !
echo.
echo ✅ Le code est en ligne sur :
echo    https://github.com/eddyzaz38/shangrimclauncher
echo.
echo Pour publier une nouvelle version du launcher :
echo    1. Modifie "version" dans package.json (ex: "1.0.1")
echo    2. Lance : npm run publish
echo    3. Les joueurs reçoivent la MAJ automatiquement au prochain lancement !
echo.
pause
