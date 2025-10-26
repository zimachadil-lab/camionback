#!/bin/bash

# Script de migration de la base de données de développement vers production
# Usage: ./scripts/migrate-db.sh <PRODUCTION_DATABASE_URL>

set -e

if [ -z "$1" ]; then
  echo "❌ Erreur: URL de la base de données de production manquante"
  echo ""
  echo "Usage:"
  echo "  ./scripts/migrate-db.sh 'postgresql://user:password@host/database'"
  echo ""
  echo "Pour obtenir l'URL de production:"
  echo "  1. Va dans Publishing/Deployments dans Replit"
  echo "  2. Clique sur ton déploiement Reserved VM"
  echo "  3. Va dans Secrets/Environment Variables"
  echo "  4. Copie la valeur de DATABASE_URL"
  exit 1
fi

PROD_DB_URL="$1"
DEV_DB_URL="$DATABASE_URL"

if [ -z "$DEV_DB_URL" ]; then
  echo "❌ Erreur: DATABASE_URL de développement manquante"
  exit 1
fi

echo "🚀 Migration de la base de données de DEV vers PRODUCTION"
echo ""
echo "📊 Source (DEV): ${DEV_DB_URL:0:50}..."
echo "🎯 Destination (PROD): ${PROD_DB_URL:0:50}..."
echo ""

# Créer un fichier temporaire pour le dump
DUMP_FILE="/tmp/camionback_migration_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 1/3 - Export des données de développement..."
pg_dump "$DEV_DB_URL" --data-only --no-owner --no-acl > "$DUMP_FILE"

if [ $? -eq 0 ]; then
  echo "   ✅ Export réussi: $DUMP_FILE"
else
  echo "   ❌ Erreur lors de l'export"
  exit 1
fi

echo ""
echo "📥 2/3 - Import des données vers production..."
psql "$PROD_DB_URL" < "$DUMP_FILE"

if [ $? -eq 0 ]; then
  echo "   ✅ Import réussi"
else
  echo "   ❌ Erreur lors de l'import"
  echo "   ⚠️  Le fichier de dump est conservé: $DUMP_FILE"
  exit 1
fi

echo ""
echo "🧹 3/3 - Nettoyage..."
rm -f "$DUMP_FILE"
echo "   ✅ Fichier temporaire supprimé"

echo ""
echo "✅ MIGRATION TERMINÉE AVEC SUCCÈS ! 🎉"
echo "🌐 Tous tes utilisateurs peuvent maintenant se connecter sur camionback.com"
