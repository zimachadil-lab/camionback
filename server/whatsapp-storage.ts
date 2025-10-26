import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { db } from "./db";
import { whatsappSessionFiles } from "../shared/schema";
import { eq } from "drizzle-orm";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Service pour sauvegarder et restaurer les sessions WhatsApp dans PostgreSQL
 * Ceci permet aux sessions de persister même après republication de l'app
 */
export class WhatsAppStorageService {
  constructor() {
    console.log('📦 Service de stockage WhatsApp PostgreSQL initialisé');
  }

  /**
   * Sauvegarde tous les fichiers de session WhatsApp dans PostgreSQL
   * @param localAuthDir Chemin local du dossier .wwebjs_auth
   */
  async backupSession(localAuthDir: string): Promise<void> {
    try {
      // Vérifie que le dossier local existe
      if (!fs.existsSync(localAuthDir)) {
        console.log("⚠️ Aucun dossier de session WhatsApp local à sauvegarder");
        return;
      }

      console.log("📤 Début de la sauvegarde des sessions WhatsApp dans PostgreSQL...");
      
      // Parcourt récursivement tous les fichiers du dossier de session
      await this.uploadDirectory(localAuthDir, "");
      
      console.log("✅ Sessions WhatsApp sauvegardées dans PostgreSQL");
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde des sessions WhatsApp:", error);
      throw error;
    }
  }

  /**
   * Restaure les sessions WhatsApp depuis PostgreSQL vers le dossier local
   * @param localAuthDir Chemin local du dossier .wwebjs_auth
   */
  async restoreSession(localAuthDir: string): Promise<boolean> {
    try {
      console.log("📥 Tentative de restauration des sessions WhatsApp depuis PostgreSQL...");

      // Récupère tous les fichiers depuis la base de données
      const files = await db.select().from(whatsappSessionFiles);
      
      if (files.length === 0) {
        console.log("ℹ️ Aucune session WhatsApp trouvée dans PostgreSQL");
        return false;
      }

      // Crée le dossier local s'il n'existe pas
      if (!fs.existsSync(localAuthDir)) {
        await mkdir(localAuthDir, { recursive: true });
      }

      // Restaure chaque fichier
      for (const file of files) {
        const localPath = path.join(localAuthDir, file.filepath);
        
        // Crée les sous-dossiers si nécessaire
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }

        // Décode le contenu base64 et écrit le fichier
        const content = Buffer.from(file.content, 'base64');
        await writeFile(localPath, content);
        console.log(`  ✓ Restauré: ${file.filepath}`);
      }

      console.log("✅ Sessions WhatsApp restaurées depuis PostgreSQL");
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la restauration des sessions WhatsApp:", error);
      return false;
    }
  }

  /**
   * Upload récursif d'un dossier vers PostgreSQL
   */
  private async uploadDirectory(localDir: string, relativePath: string): Promise<void> {
    const entries = await readdir(localDir);

    for (const entry of entries) {
      const localPath = path.join(localDir, entry);
      const relativeFilePath = relativePath ? path.join(relativePath, entry) : entry;
      const stats = await stat(localPath);

      if (stats.isDirectory()) {
        // Récursif pour les sous-dossiers
        await this.uploadDirectory(localPath, relativeFilePath);
      } else {
        // Lit le fichier et le convertit en base64
        const content = await readFile(localPath);
        const base64Content = content.toString('base64');

        // Sauvegarde ou met à jour dans la base de données
        const existing = await db.select()
          .from(whatsappSessionFiles)
          .where(eq(whatsappSessionFiles.filepath, relativeFilePath))
          .limit(1);

        if (existing.length > 0) {
          // Met à jour le fichier existant
          await db.update(whatsappSessionFiles)
            .set({ 
              content: base64Content,
              updatedAt: new Date()
            })
            .where(eq(whatsappSessionFiles.filepath, relativeFilePath));
        } else {
          // Insère un nouveau fichier
          await db.insert(whatsappSessionFiles).values({
            filepath: relativeFilePath,
            content: base64Content,
          });
        }
        
        console.log(`  ✓ Sauvegardé: ${relativeFilePath}`);
      }
    }
  }

  /**
   * Vérifie si des sessions existent dans PostgreSQL
   */
  async hasStoredSession(): Promise<boolean> {
    try {
      const files = await db.select()
        .from(whatsappSessionFiles)
        .limit(1);
      return files.length > 0;
    } catch (error) {
      console.error("❌ Erreur lors de la vérification des sessions:", error);
      return false;
    }
  }
}
