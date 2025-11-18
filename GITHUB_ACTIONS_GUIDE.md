# 🚀 Guide GitHub Actions - Build Automatique AAB

## ✅ Configuration Complétée

Deux workflows GitHub Actions ont été configurés pour générer automatiquement votre fichier .AAB :

---

## 📋 Workflows Disponibles

### 1️⃣ Build Automatique (À chaque Push)

**Fichier:** `.github/workflows/android-build.yml`

**Déclenchement:**
- À chaque push sur `main` ou `master`
- Manuellement depuis GitHub

**Ce qu'il fait:**
1. ✅ Installe Java 17 et Node.js 20
2. ✅ Build votre application web
3. ✅ Sync Capacitor avec Android
4. ✅ Génère le fichier AAB
5. ✅ Le rend disponible en téléchargement

### 2️⃣ Release Automatique (Tags)

**Fichier:** `.github/workflows/android-release.yml`

**Déclenchement:**
- Quand vous créez un tag `v1.0`, `v1.1`, etc.

**Ce qu'il fait:**
- Tout comme le workflow 1
- **PLUS:** Crée une release GitHub avec lien de téléchargement direct

---

## 🎯 Comment Utiliser

### Option 1: Build Automatique (Simple)

**1. Push votre code sur GitHub:**
```bash
git add .
git commit -m "Update app"
git push origin main
```

**2. Télécharger l'AAB:**
1. Aller sur votre repo GitHub
2. Cliquer sur l'onglet **"Actions"**
3. Cliquer sur le dernier workflow (🚀 Build Android AAB)
4. Descendre à la section **"Artifacts"**
5. Cliquer sur **"camionback-app-release"** pour télécharger

**✅ Lien direct format:**
```
https://github.com/VOTRE-USERNAME/VOTRE-REPO/actions
```

---

### Option 2: Release avec Lien Direct (Recommandé)

**1. Créer un tag de version:**
```bash
# Pour version 1.0
git tag v1.0
git push origin v1.0
```

**2. Télécharger l'AAB:**
1. Aller sur votre repo GitHub
2. Cliquer sur **"Releases"** (colonne de droite)
3. Voir la release **"CamionBack v1.0"**
4. Cliquer sur **"app-release.aab"** pour télécharger

**✅ Lien direct format:**
```
https://github.com/VOTRE-USERNAME/VOTRE-REPO/releases
```

**💡 Avantage:** Lien permanent, facile à partager !

---

## 🔄 Workflow de Développement Recommandé

### Pour chaque nouvelle version:

```bash
# 1. Faire vos modifications
# 2. Commit
git add .
git commit -m "Nouvelle fonctionnalité X"

# 3. Push
git push origin main

# 4. Créer une release
git tag v1.1
git push origin v1.1

# 5. Attendre 5-10 minutes
# 6. Télécharger depuis GitHub Releases
```

---

## 🎨 Exemple de Versions

```bash
# Version initiale
git tag v1.0
git push origin v1.0

# Corrections de bugs
git tag v1.0.1
git push origin v1.0.1

# Nouvelles fonctionnalités
git tag v1.1.0
git push origin v1.1.0

# Version majeure
git tag v2.0.0
git push origin v2.0.0
```

---

## ⏱️ Temps de Build

- **Durée:** 5-10 minutes
- **État:** Visible en temps réel dans l'onglet Actions
- **Notification:** GitHub peut vous envoyer un email quand c'est terminé

---

## 📥 Téléchargement Manuel (Sans Attendre)

Si vous voulez déclencher un build manuellement:

1. Aller sur **Actions**
2. Cliquer sur **"🚀 Build Android AAB"** (à gauche)
3. Cliquer sur **"Run workflow"** (bouton bleu)
4. Sélectionner la branche `main`
5. Cliquer **"Run workflow"**

---

## 🔐 Signature (Optionnel)

**Par défaut:** AAB non signé (suffisant pour tester)

**Pour production Google Play:**

### Option A: Google Play App Signing (RECOMMANDÉ)
- Laisser Google gérer la signature
- Aucune configuration nécessaire
- Plus sécurisé

### Option B: Signer avec GitHub Secrets

**1. Créer un keystore:**
```bash
keytool -genkey -v -keystore camionback.keystore -alias camionback -keyalg RSA -keysize 2048 -validity 10000
```

**2. Encoder en base64:**
```bash
base64 camionback.keystore > keystore.txt
```

**3. Ajouter dans GitHub:**
- Settings → Secrets and variables → Actions
- Ajouter:
  - `KEYSTORE_FILE` (contenu de keystore.txt)
  - `KEYSTORE_PASSWORD` (mot de passe keystore)
  - `KEY_ALIAS` (camionback)
  - `KEY_PASSWORD` (mot de passe clé)

**4. Modifier le workflow** (je peux le faire si vous voulez)

---

## 📊 Statistiques

### Ressources Utilisées:
- **Durée:** ~8 minutes par build
- **Minutes GitHub gratuites:** 2000/mois (repos publics illimité)
- **Stockage artifacts:** 30 jours
- **Coût:** **GRATUIT** pour repos publics ! 🎉

---

## 🛠️ Dépannage

### Build échoue?

**1. Vérifier les logs:**
- Actions → Cliquer sur le workflow rouge
- Voir quelle étape a échoué

**2. Erreurs communes:**

**"npm install failed"**
```bash
# Solution: Supprimer package-lock.json et réessayer
git rm package-lock.json
git commit -m "Fix dependencies"
git push
```

**"Gradle build failed"**
- Vérifier `android/app/build.gradle`
- Peut nécessiter un `./gradlew clean`

**"Out of memory"**
- Rare, mais peut arriver
- Re-run le workflow (souvent ça passe)

### Artifact non disponible?

- Les artifacts expirent après 30 jours
- Utilisez les Releases pour conservation permanente

---

## 📱 Liens Rapides

### Vos Workflows:
```
https://github.com/VOTRE-USERNAME/VOTRE-REPO/actions
```

### Vos Releases:
```
https://github.com/VOTRE-USERNAME/VOTRE-REPO/releases
```

### Documentation GitHub Actions:
- https://docs.github.com/en/actions

---

## 🎯 Résumé

**Workflow Simple:**
1. Push code → Attend 8 min → Télécharge depuis Actions

**Workflow Professionnel:**
1. Tag version → Attend 8 min → Télécharge depuis Releases
2. **Lien permanent disponible pour toujours !**

---

## 💡 Conseils Pro

1. **Utilisez les tags** pour versions importantes
2. **Testez d'abord** avec build automatique
3. **Releases = production**, Artifacts = tests
4. **Notifications email** activées par défaut
5. **README badges** pour montrer le statut:

```markdown
![Android Build](https://github.com/USERNAME/REPO/workflows/🚀%20Build%20Android%20AAB/badge.svg)
```

---

## 🚀 Prochaine Étape

**1. Push votre code sur GitHub:**
```bash
git add .
git commit -m "Add GitHub Actions workflows"
git push origin main
```

**2. Attendre 8 minutes**

**3. Aller sur:**
```
https://github.com/VOTRE-USERNAME/VOTRE-REPO/actions
```

**4. Télécharger votre AAB ! 🎉**

---

**Automatisation = Gain de Temps = Plus de Développement ! 💪**
