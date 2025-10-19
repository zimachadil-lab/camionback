import bcrypt from 'bcrypt';
import { storage } from '../server/storage.js';

async function createAdmin() {
  const phoneNumber = '+212664373534';
  const password = '040189';
  
  // Check if user already exists
  const existing = await storage.getUserByPhone(phoneNumber);
  if (existing) {
    console.log('⚠️  Un utilisateur existe déjà avec ce numéro!');
    console.log('👤 ID:', existing.id);
    console.log('🎭 Rôle:', existing.role);
    console.log('📛 Nom:', existing.name || 'Non défini');
    
    // Update to admin if not already
    if (existing.role !== 'admin') {
      await storage.updateUser(existing.id, { role: 'admin' });
      console.log('✅ Rôle mis à jour vers "admin"');
    }
    
    process.exit(0);
  }
  
  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create admin user
  const admin = await storage.createUser({
    phoneNumber,
    passwordHash,
    role: 'admin',
    name: 'Administrateur',
    accountStatus: 'active',
    isActive: true,
  });
  
  console.log('✅ Admin créé avec succès!');
  console.log('📱 Téléphone:', phoneNumber);
  console.log('🔑 Mot de passe:', password);
  console.log('👤 ID:', admin.id);
  console.log('');
  console.log('⚠️  IMPORTANT: Cet admin est créé dans la base de DÉVELOPPEMENT.');
  console.log('Pour la version publiée, vous devrez créer ce compte via l\'interface admin ou la console de production.');
  
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('❌ Erreur lors de la création de l\'admin:', err);
  process.exit(1);
});
