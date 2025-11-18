#!/bin/bash

echo "🚀 Configuration GitHub pour CamionBack"
echo "======================================="
echo ""

# Configurer Git
echo "📝 Configuration Git..."
git config --global user.name "zimachadil-lab"
git config --global user.email "zimachadil-lab@users.noreply.github.com"

# Initialiser Git si nécessaire
if [ ! -d .git ]; then
    echo "🔧 Initialisation Git..."
    git init
fi

# Ajouter tous les fichiers
echo "📦 Ajout des fichiers..."
git add .

# Commit
echo "💾 Commit des fichiers..."
git commit -m "CamionBack - Configuration Android complète avec GitHub Actions" || echo "Fichiers déjà commités"

# Vérifier si remote existe
if git remote | grep -q "origin"; then
    echo "🔄 Remote origin existe déjà, suppression..."
    git remote remove origin
fi

# Ajouter remote
echo "🔗 Connexion au repository GitHub..."
git remote add origin https://github.com/zimachadil-lab/camionback.git

# Renommer branche
echo "🌿 Renommage de la branche en main..."
git branch -M main

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📌 PROCHAINE ÉTAPE:"
echo "   Exécutez: ./push-github.sh"
echo ""
