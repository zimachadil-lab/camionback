# 🔧 Guide de Test - Enregistrement du Device Token

## ✅ Problèmes Corrigés

### 1. **Provider lisait la mauvaise clé localStorage**
- **Avant** : Cherchait `"user"` 
- **Après** : Cherche `"camionback_user"` ✅

### 2. **Provider ne réagissait pas aux changements de connexion**
- **Avant** : Lisait localStorage une seule fois au montage
- **Après** : Vérifie automatiquement toutes les 2 secondes si l'utilisateur a changé ✅

### 3. **Notification directe ne fonctionnait pas sur Android**
- **Avant** : Utilisait `new Notification()` (interdit sur Android)
- **Après** : Utilise `registration.showNotification()` ✅

---

## 📱 **NOUVELLE PROCÉDURE DE TEST**

### **Étape 1 : Connecter Chrome DevTools**

**Sur PC** :
1. Chrome → `chrome://inspect`
2. Connecter téléphone Android via USB
3. Cliquer "Inspect"
4. Ouvrir l'onglet **Console**

### **Étape 2 : Se Connecter en tant que Client ou Transporteur**

**Sur téléphone** :
1. Si vous êtes déjà connecté, **déconnectez-vous d'abord**
2. Retournez sur la page d'accueil `/`
3. **Connectez-vous** avec votre numéro de téléphone et PIN

### **Étape 3 : Surveiller les Logs dans chrome://inspect**

Après la connexion, vous devriez voir dans la Console :

#### **A. Logs du Provider** (détection de l'utilisateur)
```
🔄 [PushNotificationProvider] User loaded from localStorage: {
  id: "123",
  name: "Votre Nom",
  role: "client",
  phoneNumber: "+212..."
}
```

#### **B. Logs du Hook usePushNotifications** (enregistrement du token)

Si **permission déjà accordée** (vous avez déjà autorisé les notifications) :
```
🔔 === [usePushNotifications] DÉBUT CONFIGURATION PUSH NOTIFICATIONS ===
🔔 [usePushNotifications] userId: 123
🔔 [usePushNotifications] permission actuelle: granted
✅ [usePushNotifications] Permission déjà accordée
🔍 [usePushNotifications] Récupération de la souscription existante...
✅ [usePushNotifications] Souscription existante trouvée: {
  endpoint: "https://fcm.googleapis.com/...",
  expirationTime: null
}
✅ [usePushNotifications] Subscription obtenue !
📤 [usePushNotifications] Envoi du device token au serveur...
📤 [usePushNotifications] Device token length: 456
✅ ✅ ✅ [usePushNotifications] PUSH NOTIFICATIONS ACTIVÉES ET SYNCHRONISÉES ! ✅ ✅ ✅
```

Si **permission non accordée** (première fois) :
```
🔔 === [usePushNotifications] DÉBUT CONFIGURATION PUSH NOTIFICATIONS ===
🔔 [usePushNotifications] userId: 123
🔔 [usePushNotifications] permission actuelle: default
🔔 [usePushNotifications] Permission par défaut, demande de permission...
[Popup de demande de permission apparaît]
```
→ Acceptez la permission, et les logs continueront comme ci-dessus

### **Étape 4 : Surveiller les Logs Serveur Replit**

**Sur PC, dans Replit** :
1. Ouvrir l'onglet **"Console"**
2. Vous devriez voir :

```
📱 Device token valide reçu: {
  userId: '123',
  endpoint: 'https://fcm.googleapis.com/fcm/send/...',
  hasKeys: true
}
✅ Device token enregistré pour Votre Nom (+212...) - Role: client
```

### **Étape 5 : Vérifier dans la Base de Données (Optionnel)**

**Dans Replit** :
1. Onglet "Shell"
2. Exécutez :
   ```bash
   psql $DATABASE_URL -c "SELECT id, name, phone_number, role, LENGTH(device_token) as token_length FROM users WHERE id = 'VOTRE_USER_ID';"
   ```

Vous devriez voir :
```
 id  |   name    | phone_number | role   | token_length
-----+-----------+--------------+--------+-------------
 123 | Votre Nom | +212...      | client |    456
```

Si `token_length` n'est pas NULL → ✅ **Token enregistré avec succès !**

---

## 🔍 **DIAGNOSTICS D'ERREUR**

### ❌ **Aucun log `[PushNotificationProvider]` n'apparaît**

**Cause** : Le provider ne détecte pas l'utilisateur connecté

**Solutions** :
1. Vérifier que vous êtes bien connecté (regardez dans `localStorage` via DevTools → Application → Local Storage)
2. Vérifier que la clé est bien `camionback_user`
3. Recharger la page complètement

### ❌ **Logs Provider OK, mais aucun log `[usePushNotifications]`**

**Cause** : Le hook ne s'exécute pas

**Solutions** :
1. Vérifier que `userId` n'est pas null dans les logs du Provider
2. Attendre 2-3 secondes (le polling vérifie toutes les 2 secondes)
3. Recharger la page

### ❌ **Logs Hook OK, mais aucun log serveur**

**Cause** : La requête PATCH n'arrive pas au serveur

**Solutions** :
1. Vérifier la console pour des erreurs réseau (DevTools → Network)
2. Vérifier que l'endpoint `/api/users/:id/device-token` existe
3. Vérifier que `userId` est correct

### ❌ **Erreur serveur `Device token invalide`**

**Cause** : Le token n'est pas au bon format JSON

**Solutions** :
1. Vérifier les logs du hook : `📤 Device token length:` doit être > 0
2. Recréer la subscription en allant sur `/push-diagnostic` → "Forcer Création de la Subscription"

---

## 🎯 **TEST COMPLET : Notifications de Message**

Une fois le token enregistré, testez une **vraie notification** :

### **Avec 2 Utilisateurs** :

1. **Utilisateur A** (Client) : Connecté sur téléphone avec token enregistré
2. **Utilisateur B** (Transporteur) : Connecté sur PC

**Test** :
1. **B** envoie un message à **A** via le chat
2. **A** devrait recevoir une notification push sur son téléphone 🎉

**Logs attendus dans chrome://inspect (téléphone A)** :
```
🔔 🔔 🔔 [Service Worker] PUSH EVENT RECEIVED! 🔔 🔔 🔔
[Service Worker] Push data exists, parsing...
[Service Worker] Parsed push data: {
  title: "💬 Nouveau message",
  body: "Transporteur X vous a envoyé un message"
}
✅ ✅ ✅ [Service Worker] NOTIFICATION DISPLAYED SUCCESSFULLY! ✅ ✅ ✅
```

**Et la notification apparaît sur le téléphone** ✅

---

## 📊 **CE QUE VOUS DEVEZ ME FOURNIR**

### 1. **Logs Console (chrome://inspect)** après connexion

Copier depuis :
```
🔄 [PushNotificationProvider] User loaded from localStorage: ...
```
Jusqu'à :
```
✅ ✅ ✅ [usePushNotifications] PUSH NOTIFICATIONS ACTIVÉES ET SYNCHRONISÉES ! ✅ ✅ ✅
```

### 2. **Logs Serveur Replit**

Cherchez :
```
📱 Device token valide reçu: ...
✅ Device token enregistré pour ...
```

### 3. **Test de Notification Réelle**

- Envoyez un message depuis un autre compte
- Dites-moi si la notification apparaît sur le téléphone

---

## 🚀 **PROCHAINES ÉTAPES**

1. **Déconnectez-vous**
2. **Reconnectez-vous**
3. **Surveillez les logs** (chrome://inspect + Replit Console)
4. **Testez une notification réelle** (envoi de message)
5. **Envoyez-moi les résultats !**

Le token devrait maintenant s'enregistrer automatiquement à chaque connexion ! 🎯
