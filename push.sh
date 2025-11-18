#!/bin/bash

echo "🚀 Push automatique vers GitHub"
echo "================================"
echo ""

# Vérifier si GITHUB_TOKEN existe dans les Secrets
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GitHub Token non trouvé dans les Secrets Replit"
    echo ""
    echo "📝 ÉTAPES RAPIDES:"
    echo ""
    echo "1. Créer un token sur GitHub:"
    echo "   https://github.com/settings/tokens/new"
    echo ""
    echo "2. Remplir:"
    echo "   - Note: Replit CamionBack"
    echo "   - Expiration: 90 days"
    echo "   - Cocher: ✅ repo"
    echo "   - Cocher: ✅ workflow"
    echo ""
    echo "3. Copier le token (ghp_...)"
    echo ""
    echo "4. Dans Replit:"
    echo "   - Ouvrir l'onglet Secrets (🔒 à gauche)"
    echo "   - Cliquer 'New secret'"
    echo "   - Key: GITHUB_TOKEN"
    echo "   - Value: Coller votre token"
    echo "   - Cliquer 'Add secret'"
    echo ""
    echo "5. Relancer ce script: ./push.sh"
    echo ""
    exit 1
fi

echo "✅ Token trouvé dans Secrets"
echo ""

# Ajouter tous les fichiers
echo "📦 Ajout des fichiers..."
git add .

# Commit
echo "💾 Commit..."
git commit -m "Fix: AAB build - passage en mode debug" || echo "Rien à commiter (déjà fait)"

# Push avec token depuis les Secrets
echo "📤 Push vers GitHub..."
echo ""

git push https://$GITHUB_TOKEN@github.com/zimachadil-lab/camionback.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅"
    echo ""
    echo "🎉 Votre code est sur GitHub !"
    echo ""
    echo "📍 Voir le build ici (attendez 8 minutes):"
    echo "   https://github.com/zimachadil-lab/camionback/actions"
    echo ""
    echo "✅ Cette fois-ci le build devrait être VERT !"
    echo ""
else
    echo ""
    echo "❌ Erreur lors du push"
    echo ""
    echo "Vérifiez:"
    echo "- Le token a les permissions 'repo' ET 'workflow'"
    echo "- Le token est valide (pas expiré)"
    echo ""
fi
