#!/bin/bash

echo "🚀 Push vers GitHub"
echo "==================="
echo ""

# Vérifier si GITHUB_TOKEN existe
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GitHub Token non trouvé"
    echo ""
    echo "📝 OPTION 1: Utiliser l'interface Replit Git (PLUS FACILE)"
    echo "   1. Cliquer sur l'icône Git (à gauche) dans Replit"
    echo "   2. Cliquer sur 'Connect to GitHub'"
    echo "   3. Autoriser Replit"
    echo "   4. Push automatique !"
    echo ""
    echo "📝 OPTION 2: Créer un Personal Access Token"
    echo "   1. Aller sur: https://github.com/settings/tokens/new"
    echo "   2. Note: 'Replit CamionBack'"
    echo "   3. Expiration: 90 days"
    echo "   4. Cocher: 'repo' (Full control)"
    echo "   5. Cliquer 'Generate token'"
    echo "   6. Copier le token (commence par ghp_...)"
    echo ""
    echo "   Puis dans Replit:"
    echo "   - Onglet 'Secrets' (🔒 dans la barre latérale)"
    echo "   - Ajouter secret:"
    echo "     Nom: GITHUB_TOKEN"
    echo "     Valeur: <votre token>"
    echo "   - Exécuter à nouveau: ./push-github.sh"
    echo ""
    exit 1
fi

echo "✅ GitHub Token trouvé"
echo "📤 Push en cours..."
echo ""

# Push avec token
git push https://$GITHUB_TOKEN@github.com/zimachadil-lab/camionback.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅"
    echo ""
    echo "🎉 Votre code est maintenant sur GitHub !"
    echo ""
    echo "📥 Dans 8 minutes, téléchargez votre AAB ici:"
    echo "   https://github.com/zimachadil-lab/camionback/actions"
    echo ""
else
    echo ""
    echo "❌ Erreur lors du push"
    echo "Vérifiez que le token est valide et que le repo existe"
fi
