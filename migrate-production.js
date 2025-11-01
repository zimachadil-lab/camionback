#!/usr/bin/env node
/**
 * Script de migration automatique pour la production
 * Exécute la migration des rôles : "transporter" → "transporteur"
 */

const { Client } = require('pg');

async function runMigration() {
  console.log('🚀 Démarrage de la migration production...\n');
  
  // Utiliser la DATABASE_URL de l'environnement
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERREUR: DATABASE_URL non trouvée dans les variables d\'environnement');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');
    
    // Étape 1: État initial
    console.log('📊 État AVANT migration:');
    const beforeResult = await client.query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role');
    console.table(beforeResult.rows);
    
    // Étape 2: Mettre à jour "transporter" → "transporteur"
    console.log('\n🔄 Mise à jour: "transporter" → "transporteur"...');
    const updateTransporter = await client.query(
      "UPDATE users SET role = 'transporteur' WHERE role = 'transporter'"
    );
    console.log(`✅ ${updateTransporter.rowCount} transporteurs mis à jour`);
    
    // Étape 3: Corriger "coordinateur" → "coordinator"
    console.log('\n🔄 Mise à jour: "coordinateur" → "coordinator"...');
    const updateCoordinator = await client.query(
      "UPDATE users SET role = 'coordinator' WHERE role = 'coordinateur'"
    );
    console.log(`✅ ${updateCoordinator.rowCount} coordinateurs mis à jour`);
    
    // Étape 4: Supprimer les comptes sans rôle
    console.log('\n🗑️  Suppression des comptes incomplets (sans rôle)...');
    const deleteEmpty = await client.query(
      "DELETE FROM users WHERE role IS NULL OR role = ''"
    );
    console.log(`✅ ${deleteEmpty.rowCount} comptes incomplets supprimés`);
    
    // Étape 5: Supprimer l'ancien constraint
    console.log('\n🔧 Suppression de l\'ancien constraint...');
    await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    console.log('✅ Ancien constraint supprimé');
    
    // Étape 6: Ajouter le nouveau constraint
    console.log('\n🔧 Ajout du nouveau constraint avec "transporteur"...');
    await client.query(
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'transporteur', 'admin', 'coordinator'))"
    );
    console.log('✅ Nouveau constraint ajouté');
    
    // Étape 7: État final
    console.log('\n📊 État APRÈS migration:');
    const afterResult = await client.query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role');
    console.table(afterResult.rows);
    
    console.log('\n🎉 MIGRATION RÉUSSIE ! Vous pouvez maintenant republier l\'application.');
    
  } catch (error) {
    console.error('\n❌ ERREUR pendant la migration:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Déconnexion de la base de données');
  }
}

runMigration();
