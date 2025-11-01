-- À COPIER-COLLER dans l'interface Database de Replit (Production Database)
-- Après avoir republié l'application

-- Mettre à jour les données existantes
UPDATE users SET role = 'transporteur' WHERE role = 'transporter';
UPDATE users SET role = 'coordinator' WHERE role = 'coordinateur';
DELETE FROM users WHERE role IS NULL OR role = '';

-- Vérifier le résultat
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;
