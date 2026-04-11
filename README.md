# ShangriMc Launcher

Launcher officiel pour le serveur ShangriMc — Forge 1.20.1

---

## ⚙️ Installation & Lancement

### Prérequis
- **Node.js** v18+ → https://nodejs.org
- **Java 17** → https://adoptium.net (obligatoire pour Minecraft 1.20.1)

### 1. Installer les dépendances
```bash
cd C:\Users\atomi\Desktop\travail\shangrimc
npm install
```

### 2. Lancer en mode développement
```bash
npm start
```

### 3. Builder l'installateur Windows
```bash
npm run build
```
L'installateur `.exe` sera dans le dossier `dist/`.

---

## 🔑 Configuration Azure — **UNE SEULE FOIS**

1. Va sur https://portal.azure.com
2. **Azure Active Directory** → **Inscriptions d'applications** → ouvre ton app
3. Clique **Authentification** → **Ajouter une plateforme** → **Web**
4. Dans "URI de redirection", entre exactement :
   ```
   http://localhost:7892
   ```
5. Clique **Configurer**, puis **Enregistrer**
6. Vérifie que dans **Types de comptes pris en charge** c'est : *"Comptes personnels Microsoft uniquement"*

> ✅ C'est tout. Le launcher démarre un mini-serveur local sur le port 7892 pour intercepter le code, sans aucune dépendance externe.

---

## 🎮 Forge — Installation

Avant de lancer le jeu pour la première fois :

1. Télécharge le Forge installer :
   https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.4.18/forge-1.20.1-47.4.18-installer.jar

2. Place-le dans :
   ```
   %AppData%\.shangrimc\forge-1.20.1-47.4.18-installer.jar
   ```
   (Le launcher t'affiche le chemin exact si le fichier est manquant)

3. Lance le jeu — le launcher s'occupe du reste !

---

## 📁 Dossier du jeu

Le jeu est installé dans : `%AppData%\.shangrimc\`

Pour y accéder : bouton **"📁 Dossier jeu"** dans le launcher.

Structure :
```
.shangrimc/
├── mods/              ← Place tes mods ici
├── versions/
├── assets/
└── forge-1.20.1-47.4.18-installer.jar  ← Requis !
```

---

## 🌐 Serveur

- **IP** : `vocalist-submission.gl.joinmc.link`
- **Version** : Forge 1.20.1 — 47.4.18

---

## 🛠 Dépannage

| Problème | Solution |
|----------|----------|
| "Compte Xbox requis" | Crée un compte Xbox gratuit sur xbox.com |
| "Minecraft non acheté" | Le compte doit avoir Minecraft Java Edition |
| Jeu qui crash | Augmente la RAM dans Paramètres (min 4 Go recommandé) |
| Forge introuvable | Suis la section "Forge — Installation" ci-dessus |
| Écran blanc au lancement | Réinstalle Java 17 depuis adoptium.net |
