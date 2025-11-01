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

    // Vérifier si la colonne is_active existe (CRITIQUE pour stats transporteurs)
    const checkIsActive = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_active'
    `);

    if (checkIsActive.rows.length === 0) {
      console.log("⚠️  Colonne is_active manquante - Création en cours...");
      
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);
      
      // Set all existing users to active by default
      await db.execute(sql`
        UPDATE users 
        SET is_active = true 
        WHERE is_active IS NULL
      `);
      
      console.log("✅ Colonne is_active créée et tous les utilisateurs activés");
    } else {
      console.log("✅ Colonne is_active déjà présente");
    }

    // Vérifier si la colonne account_status existe
    const checkAccountStatus = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'account_status'
    `);

    if (checkAccountStatus.rows.length === 0) {
      console.log("⚠️  Colonne account_status manquante - Création en cours...");
      
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'
      `);
      
      // Set all existing users to active by default
      await db.execute(sql`
        UPDATE users 
        SET account_status = 'active' 
        WHERE account_status IS NULL
      `);
      
      console.log("✅ Colonne account_status créée avec valeur par défaut 'active'");
    } else {
      console.log("✅ Colonne account_status déjà présente");
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

    // CRITICAL FIX: Rename 'transporter' to 'transporteur' (197 users affected in production)
    const transporterEnglishCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM users WHERE role = 'transporter'
    `);
    
    const countValue = (transporterEnglishCount.rows[0] as any)?.count || '0';
    const englishCount = parseInt(String(countValue), 10);
    
    if (englishCount > 0) {
      console.log(`⚠️  Trouvé ${englishCount} utilisateurs avec role='transporter' (anglais) - Migration en cours...`);
      
      await db.execute(sql`
        UPDATE users 
        SET role = 'transporteur' 
        WHERE role = 'transporter'
      `);
      
      console.log(`✅ ${englishCount} transporteurs renommés de 'transporter' → 'transporteur'`);
    } else {
      console.log("✅ Aucun utilisateur avec role='transporter' (anglais) trouvé");
    }

    // CRITICAL FIX: Rename 'coordinator' to 'coordinateur' (coordinators can't access dashboard)
    const coordinatorEnglishCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM users WHERE role = 'coordinator'
    `);
    
    const coordinatorCountValue = (coordinatorEnglishCount.rows[0] as any)?.count || '0';
    const coordinatorCount = parseInt(String(coordinatorCountValue), 10);
    
    if (coordinatorCount > 0) {
      console.log(`⚠️  Trouvé ${coordinatorCount} utilisateurs avec role='coordinator' (anglais) - Migration en cours...`);
      
      await db.execute(sql`
        UPDATE users 
        SET role = 'coordinateur' 
        WHERE role = 'coordinator'
      `);
      
      console.log(`✅ ${coordinatorCount} coordinateurs renommés de 'coordinator' → 'coordinateur'`);
    } else {
      console.log("✅ Aucun utilisateur avec role='coordinator' (anglais) trouvé");
    }

    // NEW: Add transporter_interests column for coordinator-centric workflow
    const checkTransporterInterests = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transport_requests' 
      AND column_name = 'transporter_interests'
    `);

    if (checkTransporterInterests.rows.length === 0) {
      console.log("⚠️  Colonne transporter_interests manquante - Création en cours...");
      
      await db.execute(sql`
        ALTER TABLE transport_requests 
        ADD COLUMN IF NOT EXISTS transporter_interests TEXT[] DEFAULT ARRAY[]::TEXT[]
      `);
      
      console.log("✅ Colonne transporter_interests créée");
    } else {
      console.log("✅ Colonne transporter_interests déjà présente");
    }

    // CRITICAL: Backfill NULL values to empty array (for legacy data)
    const nullInterestsResult = await db.execute(sql`
      UPDATE transport_requests 
      SET transporter_interests = ARRAY[]::TEXT[]
      WHERE transporter_interests IS NULL
    `);
    const nullInterestsCount = nullInterestsResult.rowCount || 0;
    if (nullInterestsCount > 0) {
      console.log(`✅ Backfill transporter_interests: ${nullInterestsCount} lignes mises à jour`);
    }

    // CRITICAL: Set default value for existing columns (legacy deployments)
    await db.execute(sql`
      ALTER TABLE transport_requests 
      ALTER COLUMN transporter_interests SET DEFAULT ARRAY[]::TEXT[]
    `);
    console.log("✅ DEFAULT ARRAY[] défini sur transporter_interests");

    // CRITICAL: Ensure NOT NULL constraint to prevent future NULL values
    await db.execute(sql`
      ALTER TABLE transport_requests 
      ALTER COLUMN transporter_interests SET NOT NULL
    `);
    console.log("✅ Contrainte NOT NULL ajoutée sur transporter_interests");

    // NEW: Add qualified_at column
    const checkQualifiedAt = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transport_requests' 
      AND column_name = 'qualified_at'
    `);

    if (checkQualifiedAt.rows.length === 0) {
      console.log("⚠️  Colonne qualified_at manquante - Création en cours...");
      
      await db.execute(sql`
        ALTER TABLE transport_requests 
        ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMP
      `);
      
      console.log("✅ Colonne qualified_at créée");
    } else {
      console.log("✅ Colonne qualified_at déjà présente");
    }

    // NEW: Add published_for_matching_at column
    const checkPublishedForMatchingAt = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transport_requests' 
      AND column_name = 'published_for_matching_at'
    `);

    if (checkPublishedForMatchingAt.rows.length === 0) {
      console.log("⚠️  Colonne published_for_matching_at manquante - Création en cours...");
      
      await db.execute(sql`
        ALTER TABLE transport_requests 
        ADD COLUMN IF NOT EXISTS published_for_matching_at TIMESTAMP
      `);
      
      console.log("✅ Colonne published_for_matching_at créée");
    } else {
      console.log("✅ Colonne published_for_matching_at déjà présente");
    }

    // NEW WORKFLOW: Migrate existing requests to "qualification_pending" status
    const existingRequestsCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM transport_requests 
      WHERE coordination_status = 'nouveau'
      AND status = 'open'
    `);
    
    const existingCountValue = (existingRequestsCount.rows[0] as any)?.count || '0';
    const existingCount = parseInt(String(existingCountValue), 10);
    
    if (existingCount > 0) {
      console.log(`⚠️  Migration workflow: ${existingCount} demandes 'nouveau' → 'qualification_pending'`);
      
      await db.execute(sql`
        UPDATE transport_requests 
        SET coordination_status = 'qualification_pending',
            coordination_updated_at = NOW()
        WHERE coordination_status = 'nouveau'
        AND status = 'open'
      `);
      
      console.log(`✅ ${existingCount} demandes migrées vers "À qualifier"`);
    } else {
      console.log("✅ Aucune demande à migrer vers qualification_pending");
    }

    console.log("✅ Synchronisation du schéma terminée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation du schéma:", error);
    // Ne pas bloquer le démarrage de l'application
    console.warn("⚠️  L'application démarre malgré l'erreur de migration");
  }
}
