# 📱 Guide de Génération AAB pour CamionBack

## ✅ Configuration Complétée (Haute Qualité!)

Toute la configuration Capacitor a été réalisée de manière professionnelle :

### 🎨 Assets Configurés
- ✅ **87 icônes** générées pour toutes les résolutions Android
- ✅ **Icônes adaptatives** avec fond couleur thème (#17cfcf - Teal)
- ✅ **Splash screens** pour mode portrait/paysage/dark
- ✅ **Couleur de fond** identique au theme de l'app

### ⚙️ Configuration Capacitor
- ✅ Package ID: `ma.camionback.app`
- ✅ App Name: `CamionBack`
- ✅ Permissions configurées:
  - Internet (requis)
  - Push Notifications
  - Localisation (GPS tracking)
  - Caméra (photos camions)
  - Enregistrement audio (messages vocaux)
  - Vibration

---

## 🚀 Options pour Générer l'AAB

### Option 1: Android Studio (RECOMMANDÉ - Contrôle Total)

**Étapes:**

1. **Installer Android Studio** (si pas déjà fait)
   - Télécharger: https://developer.android.com/studio
   - Installer avec Android SDK

2. **Ouvrir le projet Android**
   ```bash
   cd /votre/projet/camionback
   npx cap open android
   ```

3. **Dans Android Studio:**
   - Attendre l'indexation (première fois peut prendre 5-10 min)
   - Menu: `Build` → `Generate Signed Bundle / APK`
   - Choisir: `Android App Bundle`
   - Cliquer `Next`

4. **Signature (Première fois):**
   - Cliquer `Create new...` pour créer un keystore
   - **IMPORTANT**: Sauvegarder ces informations en lieu sûr!
     - Key store path
     - Key store password
     - Key alias
     - Key password
   - Ou laisser Google Play gérer la signature automatiquement

5. **Build Release:**
   - Choisir build variant: `release`
   - Cocher: ✅ `Signature Versions: V1, V2`
   - Cliquer `Finish`

6. **Fichier AAB généré:**
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

---

### Option 2: GitHub Actions (Cloud Build Automatique)

**Avantages:**
- Gratuit pour repos publics
- Build automatique à chaque commit
- Pas besoin de Mac/Android Studio

**Configuration:**

Créer `.github/workflows/android-build.yml`:

```yaml
name: Build Android AAB

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - name: Setup Java
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build web app
      run: npm run build
    
    - name: Sync Capacitor
      run: npx cap sync android
    
    - name: Build AAB
      run: |
        cd android
        chmod +x gradlew
        ./gradlew bundleRelease
    
    - name: Upload AAB
      uses: actions/upload-artifact@v4
      with:
        name: app-release
        path: android/app/build/outputs/bundle/release/app-release.aab
```

**Pour signer automatiquement**, ajouter les secrets dans GitHub:
- `KEYSTORE_FILE` (encodé base64)
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

---

### Option 3: Service Cloud (Codemagic / EAS)

**Codemagic** (Gratuit avec limites):
1. Connecter GitHub à https://codemagic.io
2. Configurer build Android
3. Build automatique

**EAS (Expo):**
```bash
npm install -g eas-cli
eas build --platform android
```

---

## 📦 Après Génération de l'AAB

### 1. Vérifier l'AAB
```bash
# Taille attendue: 15-30 MB
ls -lh android/app/build/outputs/bundle/release/app-release.aab
```

### 2. Tester localement (optionnel)
```bash
# Installer bundletool
brew install bundletool  # macOS
# ou télécharger depuis: https://github.com/google/bundletool/releases

# Générer APK universel pour test
bundletool build-apks --bundle=app-release.aab --output=app.apks --mode=universal

# Extraire et installer
unzip app.apks -d apks
adb install apks/universal.apk
```

---

## 🎯 Publication Google Play Store

### 1. Créer Compte Développeur
- Lien: https://play.google.com/console
- Coût: 25$ (paiement unique)

### 2. Créer Nouvelle Application
- Nom: **CamionBack**
- Langue par défaut: Français
- Type: Application

### 3. Assets Requis

**Icônes:**
- ✅ Déjà générés dans `android/app/src/main/res/mipmap-*/`

**Captures d'écran** (à fournir):
- Minimum 2 captures par type
- Téléphone: 1080x1920px ou 1440x2560px
- Tablette 7": 2560x1800px
- Tablette 10": 2560x1800px

**Feature Graphic:**
- Taille: 1024x500px
- Format: JPG ou PNG (pas de transparence)
- Suggestion: Logo CamionBack + texte "Réservez vos camions de retour"

### 4. Informations Store

**Description courte** (80 caractères max):
```
Plateforme logistique marocaine - Retours à moindre coût 🇲🇦
```

**Description complète** (4000 caractères max):
```
🚛 CamionBack - La Solution Logistique Intelligente au Maroc

Transformez vos trajets de retour en opportunités ! CamionBack connecte 
clients et transporteurs pour optimiser les retours à vide et réduire 
les coûts de transport jusqu'à 60%.

✨ FONCTIONNALITÉS CLÉS

🔵 Pour les Clients:
• Publication de demandes de transport en temps réel
• Suivi GPS des livraisons
• Paiement sécurisé intégré
• Notifications instantanées
• Support bilingue FR/AR

🟢 Pour les Transporteurs:
• Accès aux retours disponibles
• Optimisation des trajets à vide
• Revenus supplémentaires garantis
• Photos et documentation
• Matching intelligent

🎯 POURQUOI CHOISIR CAMIONBACK?

💰 Économies Réelles
Profitez de réductions jusqu'à 60% sur les trajets de retour

⚡ Plateforme Moderne
Interface intuitive, notifications push, géolocalisation

🤝 Coordinateurs Dédiés
Support professionnel pour chaque demande

🇲🇦 100% Marocain
Conçu spécifiquement pour le marché marocain

📱 Rejoignez CamionBack aujourd'hui et révolutionnez votre logistique!
```

**Catégorie:** Professionnel / Logistique

**Mots-clés:**
```
camion, transport, logistique, maroc, livraison, fret, 
retour vide, optimisation, coordinateur
```

### 5. Télécharger AAB
- Section: Production → Releases
- Créer nouvelle version
- Upload: `app-release.aab`
- Version code: 1
- Version name: 1.0

### 6. Politique de Confidentialité
**REQUIS** par Google Play.

Créer page sur votre site ou utiliser un générateur:
- https://www.freeprivacypolicy.com
- https://app-privacy-policy-generator.nisrulz.com

Exemple URL à fournir:
```
https://camionback.ma/privacy-policy
```

### 7. Formulaire Data Safety (REQUIS depuis 2022)
**Google exige une déclaration complète des données collectées.**

Accéder : Play Console → Data safety

**Réponses pour CamionBack:**

**Collecte de données:**
- ✅ Oui, nous collectons des données

**Types de données:**
1. **Informations personnelles**
   - Nom et prénom ✅
   - Numéro de téléphone ✅
   - Adresse email (si applicable) ✅

2. **Position géographique**
   - Localisation approximative ✅ (pour trajets)
   - Localisation précise ✅ (tracking GPS)

3. **Photos et vidéos**
   - Photos ✅ (photos de camions)

4. **Fichiers et documents**
   - Documents utilisateur ✅ (contrats, factures)

5. **Audio**
   - Enregistrements vocaux ✅ (messages vocaux dans chat)
   - **Justification:** Communication entre transporteurs et coordinateurs

**Utilisation des données:**
- Fonctionnalités de l'app ✅
- Analyses ✅
- Communications ✅

**Partage de données:**
- Non, aucun partage avec tiers

**Sécurité:**
- ✅ Données chiffrées en transit (HTTPS)
- ✅ Utilisateur peut demander suppression
- ✅ Conformité aux bonnes pratiques de sécurité

### 8. Soumission
- Remplir questionnaire contenu
- Sélectionner pays: Maroc (et autres si besoin)
- Âge: 3+ (app business)
- Soumettre pour review

**Délai:** 1-3 jours généralement

---

## 🔄 Mises à Jour Futures

Pour publier une mise à jour:

1. **Incrémenter version** dans `android/app/build.gradle`:
   ```gradle
   versionCode 2      // +1 à chaque update
   versionName "1.1"  // Version visible
   ```

2. **Rebuild:**
   ```bash
   npm run build
   npx cap sync android
   # Puis générer AAB comme avant
   ```

3. **Upload sur Play Console**

**Note:** Les mises à jour web (frontend) se font automatiquement sans rebuild !

---

## 🛠️ Dépannage

### Erreur: "Duplicate resources"
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### Erreur: "JAVA_HOME not set"
Installer JDK 17:
```bash
# macOS
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17

# Linux
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### Erreur signature
Google Play peut gérer la signature automatiquement:
- Play Console → Configuration → Signature de l'application
- Activer "Google Play App Signing"

---

## 📞 Support

Pour toute question:
- Documentation Capacitor: https://capacitorjs.com/docs/android
- Google Play Console: https://support.google.com/googleplay/android-developer

---

**🎉 Félicitations ! Votre app CamionBack est prête pour Google Play Store !**
