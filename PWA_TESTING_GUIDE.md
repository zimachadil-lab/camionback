# Guide de Test PWA - CamionBack

## ✅ Fichiers PWA en Place

Tous les fichiers nécessaires ont été configurés :

### 1. Configuration PWA
- ✅ `public/manifest.json` - Manifest complet avec scope et id
- ✅ `public/icons/icon-192.png` - Icône 192x192px
- ✅ `public/icons/icon-512.png` - Icône 512x512px
- ✅ `client/index.html` - Meta tags PWA et lien manifest

### 2. Service Worker
- ✅ `public/service-worker.js` - Service worker avec cache et notifications
- ✅ Stratégie de cache avancée (STATIC_CACHE + DYNAMIC_CACHE)
- ✅ Support offline complet
- ✅ Gestion des push notifications

### 3. Bouton d'Installation (Double implémentation pour robustesse)
- ✅ **Vanilla JS dans `client/index.html`** - Script inline qui capture `beforeinstallprompt` immédiatement
- ✅ **Composant React** `client/src/components/pwa-install-button.tsx` - Fallback React
- ✅ Intégration dans App.tsx
- ✅ Écoute de l'événement `beforeinstallprompt` au niveau global
- ✅ Design turquoise (#17cfcf) avec emoji 📲
- ✅ Variable globale `window.deferredPrompt` pour partage entre vanilla JS et React

## 🧪 Comment Tester sur camionback.com

### Prérequis
1. **HTTPS obligatoire** - Le site doit être servi en HTTPS
2. **Chrome/Edge** - Meilleur support PWA (Android ou Desktop)
3. **Safari iOS** - Support PWA via "Ajouter à l'écran d'accueil"

### Test 1 : Vérifier les Fichiers
Accédez à ces URLs pour vérifier que les fichiers sont accessibles :

```
https://camionback.com/manifest.json
https://camionback.com/service-worker.js
https://camionback.com/icons/icon-192.png
https://camionback.com/icons/icon-512.png
```

✅ Chaque URL doit retourner le fichier (pas d'erreur 404)

### Test 2 : Console du Navigateur
1. Ouvrir Chrome DevTools (F12)
2. Onglet **Console**
3. Chercher ces messages (dans l'ordre) :
   ```
   🚀 Initialisation PWA CamionBack...
   ✅ Service Worker enregistré pour CamionBack: /
   📱 beforeinstallprompt déclenché
   ✅ Bannière d'installation affichée
   ```
4. **Important** : Le message `📱 beforeinstallprompt déclenché` est le plus important - il confirme que le navigateur reconnaît l'app comme installable

### Test 3 : Service Worker
1. Chrome DevTools (F12)
2. Onglet **Application** > **Service Workers**
3. Vérifier qu'un service worker est enregistré pour `/`
4. Status doit être **activated and running**

### Test 4 : Manifest
1. Chrome DevTools (F12)
2. Onglet **Application** > **Manifest**
3. Vérifier :
   - Name: "CamionBack"
   - Start URL: "/"
   - Display: "standalone"
   - Icons: 2 icônes (192x192 et 512x512)

### Test 5 : Bouton d'Installation
Sur **Chrome Desktop** :
1. Visiter https://camionback.com
2. Un bouton flottant **"📲 Installer CamionBack"** doit apparaître en bas à droite
3. Cliquer dessus
4. Une popup d'installation Chrome doit s'afficher

Sur **Chrome Android** :
1. Visiter https://camionback.com
2. Un bouton flottant **"📲 Installer CamionBack"** doit apparaître
3. OU une bannière "Ajouter à l'écran d'accueil" peut apparaître en haut
4. Cliquer pour installer

Sur **Safari iOS** :
1. Visiter https://camionback.com
2. Bouton Partager (⬆️)
3. "Sur l'écran d'accueil"
4. L'icône CamionBack apparaît avec l'app

### Test 6 : App Installée
Après installation :
1. L'app s'ouvre dans une fenêtre standalone (sans barre d'adresse)
2. L'icône CamionBack est visible sur l'écran d'accueil/menu
3. La couleur turquoise (#17cfcf) est appliquée à la barre de statut (mobile)

### Test 7 : Mode Offline
1. Ouvrir l'app installée
2. **Désactiver la connexion internet**
3. Naviguer entre les pages (Dashboard, Notifications, etc.)
4. L'app doit continuer à fonctionner
5. Les pages déjà visitées s'affichent depuis le cache

### Test 8 : Notifications Push
1. Se connecter en tant que Client ou Transporteur
2. Une demande de permission pour les notifications doit apparaître
3. Accepter la permission
4. Console : `✅ Notifications push activées et synchronisées`

## 🐛 Dépannage

### Le bouton d'installation n'apparaît pas
**Causes possibles :**
1. ❌ Site pas en HTTPS → Publier sur camionback.com avec HTTPS complet
2. ❌ PWA déjà installée → Désinstaller puis réessayer
3. ❌ Navigateur non supporté → Utiliser Chrome ou Edge (pas Safari pour le test du bouton)
4. ❌ manifest.json non accessible → Vérifier l'URL
5. ❌ Service Worker pas enregistré → Vérifier dans DevTools > Application
6. ❌ Cache navigateur → Vider le cache (chrome://settings/clearBrowserData)

**Solutions détaillées :**

**1. Vérifier que le site est en HTTPS complet**
```
chrome://inspect/#service-workers
```
Le site doit être listé avec HTTPS, pas HTTP

**2. Vider complètement le cache**
- Chrome > Paramètres > Confidentialité > Effacer les données
- Cocher : Cookies, Cache, Fichiers hébergés
- Période : Toutes les données

**3. Vérifier dans DevTools**
```
F12 > Application Tab
- Manifest : Doit être sans erreur
- Service Workers : Status "activated and running"
- Storage > Cache Storage : Doit montrer les caches
```

**4. Forcer le rechargement**
- Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
- Ou Hard Reload dans DevTools (clic droit sur le bouton reload)

**5. Tester en navigation privée**
- Ouvrir une fenêtre Incognito
- Visiter https://camionback.com
- Le bouton devrait apparaître (si critères PWA remplis)

### Service Worker ne s'enregistre pas
**Erreur dans Replit Preview :**
```
❌ Erreur lors de l'enregistrement du Service Worker
```
C'est **NORMAL** en développement Replit ! Le service worker fonctionne uniquement sur HTTPS en production.

**Sur camionback.com :**
1. Vérifier que le site est en HTTPS complet
2. Vérifier que `/service-worker.js` est accessible
3. Console : chercher des erreurs spécifiques

### Notifications ne marchent pas
1. Vérifier la permission dans les paramètres du navigateur
2. Chrome > Paramètres > Confidentialité > Notifications > camionback.com
3. La permission doit être "Autoriser"

## 📝 Notes Importantes

### Développement (Replit)
⚠️ **Les Service Workers ne fonctionnent PAS correctement en développement Replit**
- C'est normal et attendu
- Ils fonctionneront en production avec HTTPS

### Production (camionback.com)
✅ **Tout doit fonctionner correctement si :**
- Le site est en HTTPS complet
- Tous les fichiers sont déployés
- Le navigateur est Chrome/Edge/Safari

### Clés VAPID (Production)
⚠️ **Avant le déploiement en production, générer de nouvelles clés VAPID :**

```bash
npx web-push generate-vapid-keys
```

Puis configurer les variables d'environnement :
```
VAPID_PUBLIC_KEY=<votre_clé_publique>
VAPID_PRIVATE_KEY=<votre_clé_privée>
VAPID_SUBJECT=mailto:contact@camionback.ma
```

Et mettre à jour `client/src/lib/pwa.ts` ligne 55 avec la nouvelle clé publique.

## ✅ Checklist de Déploiement PWA

Avant de tester sur camionback.com :

- [ ] Site déployé en HTTPS complet
- [ ] manifest.json accessible depuis /manifest.json
- [ ] service-worker.js accessible depuis /service-worker.js
- [ ] Icônes accessibles depuis /icons/icon-192.png et /icons/icon-512.png
- [ ] Nouvelles clés VAPID générées et configurées (env vars)
- [ ] Clé publique VAPID mise à jour dans client/src/lib/pwa.ts
- [ ] Test sur Chrome Desktop
- [ ] Test sur Chrome Android
- [ ] Test sur Safari iOS

## 🎉 Résultat Attendu

Une fois tout configuré correctement :

1. **Installable** : Bouton "📲 Installer CamionBack" visible
2. **Standalone** : App ouvre sans barre d'adresse
3. **Offline** : Navigation fonctionne sans internet
4. **Notifications** : Push notifications opérationnelles
5. **Icône** : Logo turquoise sur l'écran d'accueil
6. **Expérience native** : Indiscernable d'une app native !

---

**Note finale :** Si des erreurs persistent sur camionback.com, vérifier la console du navigateur pour des messages d'erreur spécifiques et les partager pour débogage.
