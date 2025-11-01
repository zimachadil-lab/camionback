import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Script de migration automatique pour synchroniser le schéma production
 * S'exécute au démarrage de l'application pour garantir que toutes les colonnes existent
 */
export async function ensureSchemaSync() {
  try {
    console.log("🔄 Vérification de la synchronisation du schéma...");

    // Vérifier si la colonne client_id existe
    const checkClientId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'client_id'
    `);

    // Si la colonne n'existe pas, la créer
    if (checkClientId.rows.length === 0) {
      console.log("⚠️  Colonne client_id manquante - Création en cours...");
      
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS client_id TEXT
      `);
      
      await db.execute(sql`
        ALTER TABLE users 
        ADD CONSTRAINT IF NOT EXISTS users_client_id_unique 
        UNIQUE (client_id)
      `);
      
      console.log("✅ Colonne client_id créée avec succès");
    } else {
      console.log("✅ Colonne client_id déjà présente");
    }

    // Vérifier et créer d'autres contraintes manquantes si nécessaire
    const checkShareToken = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'transport_requests' 
      AND constraint_name = 'transport_requests_share_token_unique'
    `);

    if (checkShareToken.rows.length === 0) {
      console.log("⚠️  Contrainte share_token manquante - Création en cours...");
      await db.execute(sql`
        ALTER TABLE transport_requests 
        ADD CONSTRAINT IF NOT EXISTS transport_requests_share_token_unique 
        UNIQUE (share_token)
      `);
      console.log("✅ Contrainte share_token créée");
    }

    const checkCoordStatus = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'coordination_statuses' 
      AND constraint_name = 'coordination_statuses_value_unique'
    `);

    if (checkCoordStatus.rows.length === 0) {
      console.log("⚠️  Contrainte coordination_statuses manquante - Création en cours...");
      await db.execute(sql`
        ALTER TABLE coordination_statuses 
        ADD CONSTRAINT IF NOT EXISTS coordination_statuses_value_unique 
        UNIQUE (value)
      `);
      console.log("✅ Contrainte coordination_statuses créée");
    }

    const checkTransporterRef = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'transporter_references' 
      AND constraint_name = 'transporter_references_transporter_id_unique'
    `);

    if (checkTransporterRef.rows.length === 0) {
      console.log("⚠️  Contrainte transporter_references manquante - Création en cours...");
      await db.execute(sql`
        ALTER TABLE transporter_references 
        ADD CONSTRAINT IF NOT EXISTS transporter_references_transporter_id_unique 
        UNIQUE (transporter_id)
      `);
      console.log("✅ Contrainte transporter_references créée");
    }

    console.log("✅ Synchronisation du schéma terminée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation du schéma:", error);
    // Ne pas bloquer le démarrage de l'application
    console.warn("⚠️  L'application démarre malgré l'erreur de migration");
  }
}
