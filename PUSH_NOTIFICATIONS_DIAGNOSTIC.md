# 🔔 Guide de Diagnostic des Notifications Push - CamionBack

## ✅ Corrections Apportées

### 1. **Problème Principal Résolu : Clés VAPID**
**Problème** : La clé VAPID publique était hardcodée dans le code client avec une valeur différente de celle du serveur.

**Solution** :
- ✅ Création de l'endpoint `/api/pwa/vapid-public-key` pour exposer la clé publique
- ✅ Modification du client pour récupérer dynamiquement la clé depuis le serveur
- ✅ Les clés VAPID client et serveur correspondent maintenant

### 2. **Logs Détaillés Ajoutés**
Logs complets pour tracer chaque étape :

**Côté Client (`client/src/lib/pwa.ts`)** :
- 🔑 Récupération de la clé VAPID publique
- 🔔 Demande de permission de notification
- ⏳ Attente du Service Worker
- 📱 Souscription aux push notifications
- 📋 Détails de la souscription (endpoint, clés)

**Côté Client (`client/src/hooks/use-push-notifications.ts`)** :
- 🔔 Configuration des push notifications
- 📤 Envoi du device token au serveur
- ✅ Confirmation de synchronisation

**Côté Serveur (`server/routes.ts`)** :
- 📱 Réception et validation du device token
- ✅ Enregistrement en base de données

**Côté Serveur (`server/push-notifications.ts`)** :
- 🚀 Début/fin d'envoi de push notification
- 🔍 Recherche de l'utilisateur
- ✅ Vérification du device token
- 📨 Envoi via Web Push API
- ✅/❌ Statut de l'envoi (succès/échec)

## 📱 Comment Tester sur Android

### Étape 1 : Vider le Cache et Réautoriser les Notifications

1. **Ouvrir Chrome sur Android**
2. **Accéder aux paramètres du site** :
   - Tapez sur les 3 points → Paramètres du site
   - Ou tapez sur le cadenas dans la barre d'adresse
3. **Réinitialiser les permissions** :
   - Notifications → Sélectionner "Autoriser"
   - Effacer les données et le cache du site
4. **Redémarrer Chrome**

### Étape 2 : Se Connecter et Vérifier l'Activation

1. **Ouvrir la console Chrome DevTools** (sur PC ou via Remote Debugging)
   - Sur PC : F12 → Console
   - Remote Debugging : chrome://inspect sur PC, connecter le téléphone
2. **Se connecter à l'application**
3. **Vérifier dans la console** :

```
✅ Service Worker enregistré pour CamionBack
🔔 Configuration des push notifications pour userId: [votre-id]
🔑 Récupération de la clé VAPID publique...
✅ Clé VAPID publique récupérée depuis le serveur
🔔 Demande de permission de notification...
🔔 Permission de notification: granted
⏳ Attente du Service Worker...
✅ Service Worker prêt
📱 Souscription aux push notifications...
✅ Souscription aux notifications push réussie
📋 Détails de la souscription: {...}
📤 Envoi du device token au serveur...
✅ Notifications push activées et synchronisées avec le serveur
```

### Étape 3 : Vérifier l'Enregistrement Côté Serveur

**Dans les logs Replit** (onglet Tools → Console), vous devriez voir :

```
📱 Device token valide reçu: {
  userId: '...',
  endpoint: 'https://fcm.googleapis.com/fcm/send/...',
  hasKeys: true
}
✅ Device token enregistré pour [Nom] ([Téléphone]) - Role: client
```

### Étape 4 : Tester l'Envoi de Notification

#### Test 1 : Nouveau Message

1. **Créer deux comptes** (Client et Transporteur)
2. **Sur le téléphone, se connecter comme Client**
3. **Sur PC, se connecter comme Transporteur**
4. **Depuis PC, envoyer un message au Client**

**Logs attendus côté serveur** :

```
🔍 Recherche de l'utilisateur [client-id] pour envoi push...
✅ Utilisateur trouvé: [Nom Client] ([Tel]) - Role: client
✅ Device token trouvé pour [Nom Client], envoi en cours...
🚀 === DÉBUT ENVOI PUSH NOTIFICATION ===
✅ Device token parsé avec succès
📨 Envoi notification push via Web Push API: {
  title: '💬 Nouveau message',
  body: '[Nom Transporteur] vous a envoyé un message',
  url: '/messages?requestId=...'
}
✅ ✅ ✅ PUSH NOTIFICATION ENVOYÉE AVEC SUCCÈS ✅ ✅ ✅
📊 Résultat Web Push: { statusCode: 201, ... }
🚀 === FIN ENVOI PUSH NOTIFICATION (SUCCÈS) ===
```

**Sur le téléphone Android** :
- 🔔 Notification apparaît dans le centre de notifications
- 📱 Vibration : [200ms, 100ms, 200ms]
- 🔊 Son de notification
- 🖼️ Logo CamionBack
- 📝 Titre : "💬 Nouveau message"
- 📝 Corps : "[Nom Transporteur] vous a envoyé un message"
- 🔘 Boutons : "Ouvrir" et "Fermer"

#### Test 2 : Nouvelle Offre

1. **Créer une demande de transport en tant que Client**
2. **Soumettre une offre en tant que Transporteur**

**Le Client devrait recevoir** :
- 🚛 Notification "Nouvelle offre reçue !"

#### Test 3 : Validation de Compte

1. **Créer un compte Transporteur**
2. **En tant qu'Admin, valider le compte**

**Le Transporteur devrait recevoir** :
- ✅ Notification "Compte validé !"

## 🔍 Diagnostic des Problèmes

### Problème : Aucune notification reçue

**Vérifications dans l'ordre** :

1. **Permission accordée ?**
   ```javascript
   // Dans la console du navigateur
   Notification.permission
   // Doit retourner "granted"
   ```

2. **Service Worker actif ?**
   ```javascript
   // Dans la console du navigateur
   navigator.serviceWorker.controller
   // Doit retourner un objet ServiceWorker
   ```

3. **Souscription push active ?**
   ```javascript
   // Dans la console du navigateur
   navigator.serviceWorker.ready.then(reg => 
     reg.pushManager.getSubscription().then(sub => console.log(sub))
   )
   // Doit retourner un objet PushSubscription
   ```

4. **Device token enregistré en base ?**
   - Vérifier dans les logs serveur si "Device token enregistré" apparaît
   - Vérifier dans la base de données PostgreSQL : 
     ```sql
     SELECT id, name, phone_number, device_token IS NOT NULL as has_token 
     FROM users 
     WHERE id = '[votre-user-id]';
     ```

5. **Clés VAPID configurées ?**
   - Vérifier dans Replit Secrets que `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` existent
   - Vérifier dans les logs serveur : pas de "⚠️ VAPID keys not configured"

### Problème : Notification envoyée côté serveur mais pas reçue

**Vérifier dans les logs serveur** :
- ✅ "PUSH NOTIFICATION ENVOYÉE AVEC SUCCÈS" ?
- ❌ "ÉCHEC ENVOI PUSH NOTIFICATION" ?

**Si échec** :
- Code 404/410 → Subscription expirée, se déconnecter/reconnecter
- Autre erreur → Vérifier les logs détaillés

### Problème : Service Worker pas actif

```javascript
// Forcer la réinscription du Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  for(let registration of registrations) {
    registration.unregister();
  }
  // Rafraîchir la page
  window.location.reload();
});
```

## 📊 Événements Déclenchant des Notifications Push

| Événement | Destinataire | Notification |
|-----------|--------------|--------------|
| **Nouveau message** | Destinataire du message | 💬 "[Expéditeur] vous a envoyé un message" |
| **Nouvelle offre** | Client (auteur de la demande) | 🚛 "Nouvelle offre reçue pour [Référence]" |
| **Offre acceptée** | Transporteur (auteur de l'offre) | ✅ "Votre offre pour [Référence] a été acceptée" |
| **Compte validé** | Transporteur | ✅ "Votre compte transporteur a été validé" |

## 🔧 Commandes Utiles

### Vérifier les Secrets Replit
```bash
# Dans le terminal Replit
echo $VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
```

### Tester l'Endpoint VAPID
```bash
curl https://[votre-url].replit.dev/api/pwa/vapid-public-key
# Doit retourner : {"publicKey":"BK..."}
```

## ✅ Checklist de Validation

- [ ] VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY existent dans Replit Secrets
- [ ] L'endpoint `/api/pwa/vapid-public-key` retourne la clé publique
- [ ] Le Service Worker est actif (vérifier dans DevTools → Application → Service Workers)
- [ ] La permission de notification est "granted"
- [ ] Une souscription push existe (vérifier dans DevTools → Application → Service Workers → Push Messaging)
- [ ] Le device token est enregistré en base de données (vérifier les logs)
- [ ] Les logs serveur montrent "PUSH NOTIFICATION ENVOYÉE AVEC SUCCÈS"
- [ ] La notification apparaît sur l'appareil mobile

## 🆘 Support

Si après toutes ces vérifications les notifications ne fonctionnent toujours pas :

1. **Vérifier la version de Chrome Android** : Minimum Chrome 89+
2. **Vérifier HTTPS** : Les notifications push nécessitent HTTPS (`.replit.dev` est OK)
3. **Désactiver les économiseurs de batterie** : Certains modes peuvent bloquer les notifications
4. **Vérifier les paramètres Android** : Paramètres → Apps → Chrome → Notifications → Autorisé

---

**Date de dernière mise à jour** : 22 octobre 2025
**Version** : 2.0 - Push Notifications Natives
