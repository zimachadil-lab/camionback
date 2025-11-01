import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * ENDPOINT TEMPORAIRE DE MIGRATION PRODUCTION
 * À supprimer après la migration réussie
 */
export async function migrateProductionData() {
  console.log('🚀 Début de la migration des données production...\n');
  
  try {
    // 1. Compter l'état initial
    const beforeCount = await db.execute(sql`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    console.log('📊 État AVANT migration:', beforeCount.rows);
    
    // 2. Mettre à jour "transporter" → "transporteur"
    const updateTransporter = await db.execute(sql`
      UPDATE users SET role = 'transporteur' WHERE role = 'transporter'
    `);
    console.log(`✅ Transporteurs mis à jour: ${updateTransporter.rowCount}`);
    
    // 3. Corriger "coordinateur" → "coordinator"
    const updateCoordinator = await db.execute(sql`
      UPDATE users SET role = 'coordinator' WHERE role = 'coordinateur'
    `);
    console.log(`✅ Coordinateurs mis à jour: ${updateCoordinator.rowCount}`);
    
    // 4. Supprimer les comptes sans rôle
    const deleteEmpty = await db.execute(sql`
      DELETE FROM users WHERE role IS NULL OR role = ''
    `);
    console.log(`✅ Comptes incomplets supprimés: ${deleteEmpty.rowCount}`);
    
    // 5. Compter l'état final
    const afterCount = await db.execute(sql`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    console.log('📊 État APRÈS migration:', afterCount.rows);
    
    return {
      success: true,
      message: 'Migration réussie !',
      before: beforeCount.rows,
      after: afterCount.rows,
      updated: {
        transporteurs: updateTransporter.rowCount,
        coordinateurs: updateCoordinator.rowCount,
        supprimés: deleteEmpty.rowCount
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    throw error;
  }
}
