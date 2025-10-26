import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Cette fonction migre toutes les données de développement vers production
async function migrateData() {
  const devDbUrl = process.env.DATABASE_URL;
  const prodDbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

  if (!devDbUrl) {
    console.error('❌ DATABASE_URL manquante');
    process.exit(1);
  }

  console.log('🚀 Début de la migration des données vers production...\n');

  // Connexion aux deux bases de données
  const devClient = neon(devDbUrl);
  const devDb = drizzle(devClient, { schema });

  const prodClient = neon(prodDbUrl);
  const prodDb = drizzle(prodClient, { schema });

  try {
    // 1. Migrer les utilisateurs
    console.log('👥 Migration des utilisateurs...');
    const users = await devDb.select().from(schema.users);
    if (users.length > 0) {
      await prodDb.insert(schema.users).values(users).onConflictDoNothing();
      console.log(`   ✅ ${users.length} utilisateurs migrés`);
    }

    // 2. Migrer les OTP codes
    console.log('🔐 Migration des codes OTP...');
    const otpCodes = await devDb.select().from(schema.otpCodes);
    if (otpCodes.length > 0) {
      await prodDb.insert(schema.otpCodes).values(otpCodes).onConflictDoNothing();
      console.log(`   ✅ ${otpCodes.length} codes OTP migrés`);
    }

    // 3. Migrer les villes
    console.log('🏙️  Migration des villes...');
    const cities = await devDb.select().from(schema.cities);
    if (cities.length > 0) {
      await prodDb.insert(schema.cities).values(cities).onConflictDoNothing();
      console.log(`   ✅ ${cities.length} villes migrées`);
    }

    // 4. Migrer les demandes de transport
    console.log('📦 Migration des demandes de transport...');
    const requests = await devDb.select().from(schema.transportRequests);
    if (requests.length > 0) {
      await prodDb.insert(schema.transportRequests).values(requests).onConflictDoNothing();
      console.log(`   ✅ ${requests.length} demandes migrées`);
    }

    // 5. Migrer les offres
    console.log('💰 Migration des offres...');
    const offers = await devDb.select().from(schema.offers);
    if (offers.length > 0) {
      await prodDb.insert(schema.offers).values(offers).onConflictDoNothing();
      console.log(`   ✅ ${offers.length} offres migrées`);
    }

    // 6. Migrer les messages de chat
    console.log('💬 Migration des messages...');
    const messages = await devDb.select().from(schema.chatMessages);
    if (messages.length > 0) {
      await prodDb.insert(schema.chatMessages).values(messages).onConflictDoNothing();
      console.log(`   ✅ ${messages.length} messages migrés`);
    }

    // 7. Migrer les notifications
    console.log('🔔 Migration des notifications...');
    const notifications = await devDb.select().from(schema.notifications);
    if (notifications.length > 0) {
      await prodDb.insert(schema.notifications).values(notifications).onConflictDoNothing();
      console.log(`   ✅ ${notifications.length} notifications migrées`);
    }

    // 8. Migrer les ratings
    console.log('⭐ Migration des évaluations...');
    const ratings = await devDb.select().from(schema.ratings);
    if (ratings.length > 0) {
      await prodDb.insert(schema.ratings).values(ratings).onConflictDoNothing();
      console.log(`   ✅ ${ratings.length} évaluations migrées`);
    }

    // 9. Migrer les contrats
    console.log('📄 Migration des contrats...');
    const contracts = await devDb.select().from(schema.contracts);
    if (contracts.length > 0) {
      await prodDb.insert(schema.contracts).values(contracts).onConflictDoNothing();
      console.log(`   ✅ ${contracts.length} contrats migrés`);
    }

    // 10. Migrer les références professionnelles
    console.log('🏢 Migration des références professionnelles...');
    const references = await devDb.select().from(schema.professionalReferences);
    if (references.length > 0) {
      await prodDb.insert(schema.professionalReferences).values(references).onConflictDoNothing();
      console.log(`   ✅ ${references.length} références migrées`);
    }

    // 11. Migrer les rapports/litiges
    console.log('⚠️  Migration des rapports/litiges...');
    const reports = await devDb.select().from(schema.reports);
    if (reports.length > 0) {
      await prodDb.insert(schema.reports).values(reports).onConflictDoNothing();
      console.log(`   ✅ ${reports.length} rapports migrés`);
    }

    // 12. Migrer les stories
    console.log('📸 Migration des stories...');
    const stories = await devDb.select().from(schema.stories);
    if (stories.length > 0) {
      await prodDb.insert(schema.stories).values(stories).onConflictDoNothing();
      console.log(`   ✅ ${stories.length} stories migrées`);
    }

    // 13. Migrer les logs WhatsApp
    console.log('📱 Migration des logs WhatsApp...');
    const whatsappLogs = await devDb.select().from(schema.whatsappNotifications);
    if (whatsappLogs.length > 0) {
      await prodDb.insert(schema.whatsappNotifications).values(whatsappLogs).onConflictDoNothing();
      console.log(`   ✅ ${whatsappLogs.length} logs WhatsApp migrés`);
    }

    // 14. Migrer les fichiers de session WhatsApp
    console.log('📂 Migration des sessions WhatsApp...');
    const sessionFiles = await devDb.select().from(schema.whatsappSessionFiles);
    if (sessionFiles.length > 0) {
      await prodDb.insert(schema.whatsappSessionFiles).values(sessionFiles).onConflictDoNothing();
      console.log(`   ✅ ${sessionFiles.length} fichiers de session WhatsApp migrés`);
    }

    // 15. Migrer les paramètres admin
    console.log('⚙️  Migration des paramètres admin...');
    const adminSettings = await devDb.select().from(schema.adminSettings);
    if (adminSettings.length > 0) {
      await prodDb.insert(schema.adminSettings).values(adminSettings).onConflictDoNothing();
      console.log(`   ✅ ${adminSettings.length} paramètres admin migrés`);
    }

    console.log('\n✅ MIGRATION TERMINÉE AVEC SUCCÈS ! 🎉');
    console.log('🌐 Tous tes utilisateurs devraient maintenant pouvoir se connecter sur camionback.com');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter la migration
migrateData()
  .then(() => {
    console.log('\n👍 Script de migration terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Échec de la migration:', error);
    process.exit(1);
  });
