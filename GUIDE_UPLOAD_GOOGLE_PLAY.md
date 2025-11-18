# 📱 Guide Complet : Upload AAB sur Google Play Store

## 🎯 ÉTAPES COMPLÈTES (De A à Z)

Une fois que vous aurez téléchargé votre AAB depuis GitHub Actions, voici comment le publier sur Google Play Store.

---

## PARTIE 1 : Télécharger l'AAB depuis GitHub

### Étape 1 : Vérifier que le Build est Terminé

**Aller sur :**
```
https://github.com/zimachadil-lab/camionback/actions
```

**Attendre que le workflow soit :**
- ✅ **VERT** (cercle vert avec checkmark)
- Nom : "🚀 Build Android AAB"

### Étape 2 : Télécharger l'AAB

1. **Cliquer sur le workflow vert ✅**
2. **Descendre en bas de la page**
3. **Section "Artifacts"**
4. **Cliquer sur "camionback-app-debug"**
5. **Un fichier ZIP sera téléchargé**

### Étape 3 : Extraire l'AAB

1. **Décompresser le fichier ZIP** téléchargé
2. **À l'intérieur :** `app-debug.aab`
3. **C'est votre fichier AAB !** 🎉

---

## PARTIE 2 : Créer un Compte Google Play Developer

### Prérequis

- **Compte Google** (Gmail)
- **Carte bancaire** (frais unique de 25 USD pour créer un compte développeur)
- **Pièce d'identité** (pour vérification)

### Étape 1 : S'inscrire

**Aller sur :**
```
https://play.google.com/console/signup
```

1. **Se connecter** avec votre compte Google
2. **Accepter les conditions**
3. **Payer les 25 USD** (frais unique, à vie)
4. **Remplir les informations** :
   - Type de compte : Développeur individuel ou Organisation
   - Nom du développeur
   - Adresse email de contact
   - Numéro de téléphone

### Étape 2 : Vérification d'Identité

Google peut demander :
- **Pièce d'identité** (carte nationale, passeport)
- **Vérification par téléphone**

**Délai :** 24-48 heures pour validation

---

## PARTIE 3 : Créer Votre Application sur Google Play Console

### Étape 1 : Accéder à la Console

**Aller sur :**
```
https://play.google.com/console
```

### Étape 2 : Créer une Nouvelle App

1. **Cliquer sur "Créer une application"** ou **"Create app"**
2. **Remplir les informations :**

   - **Nom de l'app :** `CamionBack`
   - **Langue par défaut :** Français (France)
   - **App ou jeu :** Application
   - **Gratuite ou payante :** Gratuite
   
3. **Accepter les déclarations**
4. **Cliquer sur "Créer l'application"**

---

## PARTIE 4 : Configurer l'Application

### Tableau de Bord (Dashboard)

Vous verrez plusieurs sections à compléter :

### 1. 📋 Fiche de l'Application (Store Listing)

**Aller dans : Présence sur Google Play → Fiche de l'application**

**À remplir :**

**Nom de l'app :**
```
CamionBack
```

**Description courte (80 caractères max) :**
```
Marketplace logistique pour le Maroc - Clients et transporteurs
```

**Description complète (4000 caractères max) :**
```
CamionBack - Votre Marketplace Logistique au Maroc

Connectez-vous avec des transporteurs indépendants pour tous vos besoins logistiques au Maroc.

POUR LES CLIENTS :
✅ Créez vos demandes de transport en quelques clics
✅ Recevez des offres de transporteurs qualifiés
✅ Comparez les prix et les services
✅ Suivez vos demandes en temps réel
✅ Paiement sécurisé via l'application

POUR LES TRANSPORTEURS :
✅ Accédez aux demandes de transport disponibles
✅ Proposez vos services et vos tarifs
✅ Gérez vos offres facilement
✅ Optimisez vos trajets retour vides
✅ Notifications instantanées pour nouvelles demandes

FONCTIONNALITÉS :
🌍 Interface bilingue : Français / Arabe
📱 Application mobile native
🗺️ Visualisation des trajets sur carte
💰 Réductions pour trajets retour vides
📊 Tableau de bord personnalisé par rôle
🔔 Notifications push et SMS
💬 Chat en temps réel
📄 Génération de contrats automatique

SÉCURITÉ :
🔐 Authentification sécurisée
✅ Transporteurs vérifiés par nos coordinateurs
📝 Contrats générés automatiquement
💳 Paiement sécurisé

Rejoignez CamionBack et simplifiez votre logistique au Maroc !
```

**Icône de l'application :**
- Format : PNG
- Taille : 512 x 512 pixels
- Transparence : Non autorisée
- Votre fichier : `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

**Captures d'écran (minimum 2, maximum 8 par appareil) :**

**Pour téléphone :**
- Taille recommandée : 1080 x 1920 pixels (portrait)
- Ou : 1920 x 1080 pixels (paysage)
- Format : PNG ou JPEG

**Captures à faire :**
1. Page d'accueil / Login
2. Dashboard Client
3. Création de demande
4. Dashboard Transporteur
5. Carte des trajets
6. Chat
7. Page de paiement
8. Profil utilisateur

**Catégorie :**
```
Professionnel → Productivité
```

**Adresse email de contact :**
```
Votre email professionnel
```

**Site web (optionnel) :**
```
https://camionback.ma (si vous en avez un)
```

### 2. 📱 Upload de l'AAB (Production ou Test)

**Aller dans : Versions → Test interne**

**Pourquoi "Test interne" d'abord ?**
- ✅ Permet de tester avant la production
- ✅ Pas de revue Google (plus rapide)
- ✅ Jusqu'à 100 testeurs

**Étapes :**

1. **Cliquer sur "Créer une version"**
2. **Section "App bundles" :**
   - Cliquer sur **"Upload"**
   - Sélectionner `app-debug.aab`
   - **Attendre l'upload** (quelques secondes)

3. **Google Play App Signing :**
   - Une popup apparaît : **"Continuer"**
   - Google propose de gérer la signature pour vous
   - ✅ **ACCEPTER** (c'est la méthode recommandée)
   - Google génère automatiquement une clé sécurisée

4. **Nom de la version :**
   ```
   1.0 - Version initiale
   ```

5. **Notes de version (en français) :**
   ```
   Première version de CamionBack :
   - Création de demandes de transport
   - Système d'offres pour transporteurs
   - Chat en temps réel
   - Interface bilingue FR/AR
   - Notifications push et SMS
   - Visualisation sur carte
   ```

6. **Cliquer sur "Enregistrer" puis "Vérifier la version"**

### 3. 🧪 Ajouter des Testeurs

**Dans : Test interne → Testeurs**

1. **Créer une liste de testeurs**
2. **Ajouter des emails** (max 100 pour test interne)
3. **Cliquer sur "Enregistrer"**

**Les testeurs recevront un lien pour télécharger l'app !**

### 4. 📝 Contenu de l'Application

**Aller dans : Contenu de l'application**

**Sections à compléter :**

**a) Déclaration de confidentialité :**
- URL de votre politique de confidentialité
- (Créez-en une sur votre site ou utilisez un générateur)

**b) Accès à l'application :**
- Si login requis : Fournir compte de test
- Username : `testeur@example.com`
- Password : `Test123!`

**c) Public cible et contenu :**
- Public cible : Adultes (18+)
- Contenu : Application professionnelle

**d) Sécurité des données :**
- Types de données collectées :
  - ✅ Informations personnelles (nom, téléphone)
  - ✅ Localisation (pour les trajets)
  - ✅ Photos (profil, documents)
- Chiffrement en transit : ✅ Oui
- Possibilité de supprimer les données : ✅ Oui

### 5. ✅ Classification du Contenu

**Questionnaire obligatoire :**

1. **Violence :** Non
2. **Contenu sexuel :** Non
3. **Langage grossier :** Non
4. **Drogues/Alcool :** Non
5. **Jeux d'argent :** Non

**Cliquer sur "Enregistrer"**

---

## PARTIE 5 : Publier l'Application

### Test Interne → Production

**Une fois les tests OK :**

1. **Aller dans : Versions → Production**
2. **Cliquer sur "Créer une version"**
3. **Sélectionner la version testée** (copie depuis Test interne)
4. **Ou upload le même AAB**
5. **Remplir les notes de version**
6. **Cliquer sur "Vérifier la version"**
7. **Cliquer sur "Déployer en production"**

**Délai de revue Google : 24-48 heures**

---

## PARTIE 6 : Après Publication

### Votre App est en Ligne ! 🎉

**Lien Google Play Store :**
```
https://play.google.com/store/apps/details?id=ma.camionback.app
```

**Partager avec :**
- QR Code (généré par Google Play Console)
- Badge "Disponible sur Google Play"
- Lien direct

### Mettre à Jour l'Application

**Pour chaque nouvelle version :**

1. **Modifier `versionCode` et `versionName`** dans `android/app/build.gradle` :
   ```gradle
   versionCode 2
   versionName "1.1"
   ```

2. **Push sur GitHub** → Build automatique

3. **Télécharger le nouvel AAB**

4. **Google Play Console → Production → Créer version**

5. **Upload le nouvel AAB**

6. **Notes de version** (changements)

7. **Publier !**

---

## 📊 RÉCAPITULATIF

### ✅ Checklist Avant Publication

- [ ] Compte Google Play Developer créé (25 USD)
- [ ] Application créée sur Play Console
- [ ] AAB téléchargé depuis GitHub Actions
- [ ] Fiche de l'application complétée
- [ ] Icône et captures d'écran ajoutées
- [ ] AAB uploadé (Test interne)
- [ ] Google Play App Signing activé
- [ ] Testeurs ajoutés et testés OK
- [ ] Politique de confidentialité ajoutée
- [ ] Classification du contenu complétée
- [ ] Sécurité des données renseignée
- [ ] Prêt pour la production !

---

## 🆘 Problèmes Courants

**1. "AAB non signé"**
→ Accepter Google Play App Signing lors du premier upload

**2. "Icône invalide"**
→ Vérifier : 512x512 px, PNG, pas de transparence

**3. "Captures d'écran manquantes"**
→ Minimum 2 captures requises pour téléphone

**4. "Politique de confidentialité manquante"**
→ Créer une page sur votre site ou utiliser un générateur

**5. "Compte en attente de vérification"**
→ Attendre 24-48h après paiement des 25 USD

---

## 📞 Support Google

**Documentation officielle :**
```
https://support.google.com/googleplay/android-developer
```

**Centre d'aide :**
```
https://support.google.com/googleplay/android-developer/answer/9859152
```

---

**🎊 BONNE CHANCE POUR VOTRE PUBLICATION ! 🎊**
