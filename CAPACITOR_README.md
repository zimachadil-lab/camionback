# 📱 CamionBack - Configuration Capacitor Android

## ✅ Configuration Complétée - Haute Qualité Professionnelle

Toute la configuration Capacitor a été réalisée avec le plus haut niveau de qualité pour préparer CamionBack à la publication sur Google Play Store.

---

## 🎨 Assets Générés (87 fichiers - 3.65 MB)

### Icônes Adaptatives Android
✅ **Toutes les densités supportées:**
- ldpi (120dpi)
- mdpi (160dpi)
- hdpi (240dpi)
- xhdpi (320dpi)
- xxhdpi (480dpi)
- xxxhdpi (640dpi)

✅ **Design:**
- Foreground: Logo CamionBack
- Background: Couleur thème **#17cfcf** (Teal)
- Format: Icônes rondes et carrées
- Purpose: `any` et `maskable`

### Splash Screens
✅ **Configurations:**
- Portrait et Landscape
- Mode Light et Dark
- Toutes les densités
- Fond couleur thème: **#17cfcf**
- Logo centré avec animation

---

## ⚙️ Configuration Technique

### Capacitor Config (`capacitor.config.ts`)
```typescript
{
  appId: 'ma.camionback.app',
  appName: 'CamionBack',
  webDir: 'dist/public',
  
  android: {
    buildOptions: {
      releaseType: 'AAB'  // Google Play Store format
    }
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#17cfcf',  // Identique au theme
      splashFullScreen: true,
      splashImmersive: true
    }
  }
}
```

### Permissions Configurées
✅ **AndroidManifest.xml mis à jour:**
- `INTERNET` - Connexion réseau (requis)
- `POST_NOTIFICATIONS` - Push notifications
- `ACCESS_FINE_LOCATION` - GPS tracking
- `ACCESS_COARSE_LOCATION` - Localisation approximative
- `CAMERA` - Photos de camions
- `RECORD_AUDIO` - Enregistrements vocaux (messages vocaux dans chat)
- `ACCESS_NETWORK_STATE` - État réseau
- `VIBRATE` - Notifications tactiles

**Note:** Les appels téléphoniques utilisent `tel:` links (pas besoin de permission CALL_PHONE)

### Package Configuration
- **Package ID:** `ma.camionback.app`
- **App Name:** `CamionBack`
- **Version Code:** 1
- **Version Name:** 1.0
- **Min SDK:** 22 (Android 5.0+)
- **Target SDK:** 34 (Android 14)

---

## 📂 Structure des Fichiers

```
CamionBack/
├── capacitor.config.ts          # Configuration principale
├── android/                      # Projet Android natif
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── res/
│   │   │   │   ├── mipmap-*/     # Icônes (87 fichiers)
│   │   │   │   ├── drawable-*/   # Splash screens
│   │   │   │   └── values/
│   │   │   │       └── strings.xml
│   │   │   └── assets/
│   │   │       └── public/       # App web buildée
│   │   └── build.gradle          # Configuration build
│   └── build.gradle
├── assets/
│   ├── icon.png                  # Source icône (512x512)
│   └── splash.png                # Source splash
└── docs/
    ├── ANDROID_BUILD_GUIDE.md    # Guide complet
    └── QUICK_BUILD.md            # Guide rapide
```

---

## 🚀 Commandes Utiles

### Build et Sync
```bash
# Build l'app web et sync avec Android
npm run build
npx cap sync android

# Ou en une commande (ajoutez au package.json)
npm run cap:sync
```

### Ouvrir dans Android Studio
```bash
npx cap open android
```

### Run sur émulateur/device
```bash
npx cap run android
```

### Régénérer les icônes
```bash
npx capacitor-assets generate --android
```

---

## 📱 Checklist Google Play Store

### ✅ Prérequis Techniques (TERMINÉS)
- [x] Manifest.json valide avec icônes
- [x] Service Worker configuré
- [x] HTTPS (automatique sur Replit)
- [x] Icônes 192x192 et 512x512
- [x] Icônes maskable pour Android
- [x] Splash screens configurés
- [x] Permissions déclarées
- [x] Package ID unique

### 📋 À Préparer par Vous
- [ ] Compte Google Play Developer (25$)
- [ ] Captures d'écran (2 minimum):
  - Téléphone: 1080x1920px
  - Tablette 7": 2560x1800px (optionnel)
- [ ] Feature Graphic: 1024x500px
- [ ] Description app (4000 caractères max)
- [ ] Description courte (80 caractères max)
- [ ] Politique de confidentialité (URL)

### 🔐 Signature de l'App
**Option 1:** Google Play App Signing (RECOMMANDÉ)
- Google gère automatiquement la signature
- Plus sécurisé
- Pas besoin de keystore local

**Option 2:** Signature manuelle
- Créer keystore dans Android Studio
- **IMPORTANT:** Sauvegarder en lieu sûr
- Requis pour mises à jour futures

---

## 🎯 Prochaines Étapes

### 1. Générer l'AAB
Voir `ANDROID_BUILD_GUIDE.md` ou `QUICK_BUILD.md`

**Méthode recommandée:** Android Studio
```bash
npx cap open android
# Build → Generate Signed Bundle / APK → Android App Bundle
```

**Méthode alternative:** GitHub Actions (automatique)

### 2. Tester l'AAB
```bash
# Installer bundletool
# Générer APK universel
bundletool build-apks --bundle=app-release.aab --output=app.apks

# Installer sur device
bundletool install-apks --apks=app.apks
```

### 3. Publier sur Google Play
1. Créer compte développeur
2. Créer nouvelle app
3. Upload AAB
4. Remplir store listing
5. Soumettre pour review

---

## 🔄 Mises à Jour Futures

### Mise à jour Web Seulement (Automatique)
```bash
npm run build
npx cap sync android
# Pas besoin de rebuild l'AAB !
```

### Mise à jour Nécessitant Rebuild
- Changement de permissions
- Nouveaux plugins natifs
- Changement d'icônes/splash
- Update version Android

**Procédure:**
1. Modifier code
2. Incrémenter `versionCode` dans `build.gradle`
3. Rebuild AAB
4. Upload nouvelle version sur Play Console

---

## 🎨 Personnalisation Avancée

### Changer Couleur Theme
Éditer `capacitor.config.ts`:
```typescript
backgroundColor: '#VOTRE_COULEUR'
```
Puis regénérer:
```bash
npx capacitor-assets generate --android --splashBackgroundColor '#VOTRE_COULEUR'
```

### Ajouter Nouvelles Permissions
Éditer `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.NOUVELLE_PERMISSION" />
```

### Plugins Capacitor Supplémentaires
```bash
npm install @capacitor/camera
npx cap sync android
```

---

## 📊 Statistiques

### Assets Générés
- **Total fichiers:** 87
- **Taille totale:** 3.65 MB
- **Formats:** PNG optimisés
- **Résolutions:** ldpi à xxxhdpi

### Compatibilité
- **Android minimum:** 5.0 (API 22)
- **Android cible:** 14 (API 34)
- **Capacitor:** v7.4.4
- **Build type:** AAB (Google Play)

---

## 🛠️ Dépannage

### Problème: Splash screen ne s'affiche pas
**Solution:** Vérifier `android/app/src/main/res/values/styles.xml`

### Problème: Icône incorrecte
**Solution:** Régénérer les assets
```bash
npx capacitor-assets generate --android
npx cap sync android
```

### Problème: Build échoue
**Solution:** Clean et rebuild
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

---

## 📚 Documentation

- [Guide Build Complet](./ANDROID_BUILD_GUIDE.md)
- [Guide Rapide](./QUICK_BUILD.md)
- [Capacitor Docs](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/studio)

---

## ✨ Résumé

**CamionBack est 100% prêt pour Android !**

✅ Configuration professionnelle terminée  
✅ Assets haute qualité générés  
✅ Permissions optimisées  
✅ Couleurs theme respectées  
✅ Documentation complète fournie  

**Il ne reste plus qu'à générer l'AAB dans Android Studio et publier sur Google Play Store !**

---

**Créé avec ❤️ pour le marché marocain 🇲🇦**
