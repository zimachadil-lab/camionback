-- Migration Production : Normaliser les rôles de "transporter" à "transporteur"
-- À exécuter dans la base de données de PRODUCTION

-- 1. Mettre à jour toutes les lignes existantes
UPDATE users 
SET role = 'transporteur' 
WHERE role = 'transporter';

-- 2. Supprimer l'ancien constraint s'il existe
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Ajouter le nouveau constraint avec "transporteur"
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('client', 'transporteur', 'admin', 'coordinator'));

-- 4. Vérifier les résultats
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
