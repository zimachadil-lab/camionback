# 🔐 Signature AAB pour Google Play Store (Production)

## ⚠️ IMPORTANT

**L'AAB actuel est en mode DEBUG (non signé)**

Pour **publier sur Google Play Store en PRODUCTION**, vous DEVEZ signer l'AAB.

---

## 📝 Option 1 : Upload Play App Signing (RECOMMANDÉ - FACILE)

Google Play Console peut gérer la signature automatiquement !

### Étapes :

1. **Télécharger l'AAB debug actuel**
   - Depuis GitHub Actions : https://github.com/zimachadil-lab/camionback/actions
   - Télécharger `camionback-app-debug`

2. **Aller sur Google Play Console**
   ```
   https://play.google.com/console
   ```

3. **Créer une nouvelle application**

4. **Lors du premier upload AAB**
   - Google Play Console va proposer : **"Use Google Play App Signing"**
   - ✅ **ACCEPTER** (Google gérera la signature pour vous)
   - Google génère automatiquement une clé de signature sécurisée
   - Vous n'avez rien à faire !

5. **Upload votre AAB**
   - Google Play Console signe automatiquement votre AAB
   - C'est tout ! ✅

---

## 📝 Option 2 : Créer Votre Propre Keystore (Avancé)

Si vous préférez gérer vous-même la signature :

### Étape 1 : Créer un Keystore

**Dans Android Studio ou en ligne de commande :**

```bash
keytool -genkey -v -keystore camionback-release.keystore \
  -alias camionback \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Remplir les informations demandées :**
- Password : Choisir un mot de passe fort
- Nom, Organisation, Ville, etc.

**⚠️ IMPORTANT : Sauvegarder le keystore et le mot de passe dans un endroit SÛR !**

### Étape 2 : Configurer GitHub Secrets

**Aller sur GitHub :**
```
https://github.com/zimachadil-lab/camionback/settings/secrets/actions
```

**Ajouter 3 secrets :**

1. `KEYSTORE_FILE` : Encoder le keystore en base64
   ```bash
   base64 -i camionback-release.keystore
   ```
   Copier la sortie et créer le secret

2. `KEYSTORE_PASSWORD` : Votre mot de passe keystore

3. `KEY_ALIAS` : `camionback` (ou l'alias que vous avez choisi)

### Étape 3 : Modifier le Workflow GitHub Actions

**Modifier `.github/workflows/android-build.yml` :**

Ajouter avant l'étape "Build AAB" :

```yaml
    - name: 🔐 Decode Keystore
      run: |
        echo "${{ secrets.KEYSTORE_FILE }}" | base64 -d > android/app/camionback-release.keystore
    
    - name: 🎯 Build AAB Signé
      env:
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
      run: |
        cd android
        chmod +x gradlew
        ./gradlew bundleRelease \
          -Pandroid.injected.signing.store.file=app/camionback-release.keystore \
          -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \
          -Pandroid.injected.signing.key.alias=$KEY_ALIAS \
          -Pandroid.injected.signing.key.password=$KEYSTORE_PASSWORD
```

### Étape 4 : Modifier `android/app/build.gradle`

**Décommenter la ligne de signature :**

```gradle
buildTypes {
    release {
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        signingConfig signingConfigs.release  // ← DÉCOMMENTER CETTE LIGNE
    }
}
```

**Et ajouter la config de signature :**

```gradle
signingConfigs {
    release {
        storeFile file('camionback-release.keystore')
        storePassword System.getenv('KEYSTORE_PASSWORD')
        keyAlias System.getenv('KEY_ALIAS')
        keyPassword System.getenv('KEYSTORE_PASSWORD')
    }
}
```

---

## 💡 RECOMMANDATION

**Utilisez l'OPTION 1** (Google Play App Signing) :
- ✅ Plus simple
- ✅ Plus sécurisé (Google gère les clés)
- ✅ Pas de configuration complexe
- ✅ Google peut renouveler les certificats automatiquement

**L'OPTION 2** est pour les développeurs avancés qui veulent garder le contrôle total.

---

## 🎯 PROCHAINES ÉTAPES

**Pour publier sur Google Play Store :**

1. **Télécharger l'AAB debug** (depuis GitHub Actions)
2. **Aller sur Google Play Console**
3. **Créer nouvelle app**
4. **Activer "Google Play App Signing"**
5. **Upload l'AAB** → Google le signe automatiquement
6. **Remplir les infos** (description, screenshots, etc.)
7. **Publier !** 🚀

---

## 🆘 Besoin d'Aide ?

**Pour tester en interne d'abord :**
- Créer une "Internal Test Track" dans Play Console
- Upload l'AAB
- Ajouter des testeurs par email
- Tester avant la production

**Documentation Google :**
- https://support.google.com/googleplay/android-developer/answer/9842756
- https://developer.android.com/studio/publish/app-signing
