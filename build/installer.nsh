; ═══════════════════════════════════════════════════════════════════
;   ShangriMc Launcher — Script NSIS Custom
;   Style sombre avec animations et logo
; ═══════════════════════════════════════════════════════════════════

; Personnalisation des textes
!define MUI_WELCOMEPAGE_TITLE "Bienvenue dans ShangriMc Launcher"
!define MUI_WELCOMEPAGE_TEXT "Ce programme va installer ShangriMc Launcher sur ton ordinateur.$\r$\n$\r$\nShangriMc est un serveur Minecraft Forge 1.20.1 avec plus de 70 mods.$\r$\n$\r$\nClique sur Suivant pour continuer."

!define MUI_FINISHPAGE_TITLE "Installation terminée !"
!define MUI_FINISHPAGE_TEXT "ShangriMc Launcher a été installé avec succès.$\r$\n$\r$\nConnecte-toi avec ton compte Microsoft et clique sur Jouer.$\r$\nForge 1.20.1 et tous les mods s'installeront automatiquement au premier lancement.$\r$\n$\r$\nBonne aventure sur ShangriMc !"

!define MUI_FINISHPAGE_RUN "$INSTDIR\ShangriMc Launcher.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Lancer ShangriMc Launcher maintenant"

; Couleurs personnalisées
!define MUI_BGCOLOR "080810"
!define MUI_TEXTCOLOR "E8E8F4"
