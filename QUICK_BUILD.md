# 🚀 Build AAB en 3 Étapes

## Option Recommandée : Android Studio

### Étape 1 : Ouvrir le projet
```bash
npx cap open android
```

### Étape 2 : Build → Generate Signed Bundle
- Menu : `Build` → `Generate Signed Bundle / APK`
- Choisir : `Android App Bundle`
- Créer keystore ou laisser Google gérer

### Étape 3 : Récupérer le fichier
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Alternative : GitHub Actions (Automatique)

1. Push votre code sur GitHub
2. GitHub Actions build automatiquement
3. Télécharger l'AAB depuis "Actions" tab

---

## ✅ Tout est Prêt !

- ✅ Capacitor configuré
- ✅ 87 icônes générées avec couleur theme (#17cfcf)
- ✅ Splash screens optimisés
- ✅ Permissions configurées
- ✅ Package ID: ma.camionback.app

**Il ne reste plus qu'à cliquer sur "Build" dans Android Studio !**
