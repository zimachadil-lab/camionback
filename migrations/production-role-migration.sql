-- MIGRATION PRODUCTION : Normaliser les rôles
-- Date: 2025-11-01
-- Objectif: Mettre à jour "transporter" vers "transporteur" et nettoyer les données

-- 1. Mettre à jour "transporter" → "transporteur"
UPDATE users SET role = 'transporteur' WHERE role = 'transporter';

-- 2. Corriger "coordinateur" → "coordinator" (si existe)
UPDATE users SET role = 'coordinator' WHERE role = 'coordinateur';

-- 3. Supprimer les comptes incomplets (sans rôle)
DELETE FROM users WHERE role IS NULL OR role = '';

-- 4. Supprimer l'ancien constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 5. Ajouter le nouveau constraint avec "transporteur"
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('client', 'transporteur', 'admin', 'coordinator'));

-- 6. Vérifier le résultat
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;
