import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

/**
 * Service pour sauvegarder et restaurer les sessions WhatsApp dans Object Storage
 * Ceci permet aux sessions de persister même après republication de l'app
 */
export class WhatsAppStorageService {
  private storage: Storage;
  private bucketName: string;
  private sessionPath: string = "whatsapp-sessions";

  constructor() {
    // Configure le client Object Storage pour Replit
    this.storage = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    });

    // Récupère le bucket name depuis les variables d'environnement
    const whatsappBucket = process.env.WHATSAPP_SESSION_BUCKET;
    if (!whatsappBucket) {
      throw new Error(
        "WHATSAPP_SESSION_BUCKET environment variable not set. " +
        "Create a bucket in Object Storage tool and set this variable."
      );
    }
    this.bucketName = whatsappBucket;
  }

  /**
   * Sauvegarde tous les fichiers de session WhatsApp dans Object Storage
   * @param localAuthDir Chemin local du dossier .wwebjs_auth
   */
  async backupSession(localAuthDir: string): Promise<void> {
    try {
      // Vérifie que le dossier local existe
      if (!fs.existsSync(localAuthDir)) {
        console.log("⚠️ Aucun dossier de session WhatsApp local à sauvegarder");
        return;
      }

      console.log("📤 Début de la sauvegarde des sessions WhatsApp...");
      const bucket = this.storage.bucket(this.bucketName);
      
      // Parcourt récursivement tous les fichiers du dossier de session
      await this.uploadDirectory(localAuthDir, bucket, this.sessionPath);
      
      console.log("✅ Sessions WhatsApp sauvegardées dans Object Storage");
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde des sessions WhatsApp:", error);
      throw error;
    }
  }

  /**
   * Restaure les sessions WhatsApp depuis Object Storage vers le dossier local
   * @param localAuthDir Chemin local du dossier .wwebjs_auth
   */
  async restoreSession(localAuthDir: string): Promise<boolean> {
    try {
      console.log("📥 Tentative de restauration des sessions WhatsApp depuis Object Storage...");
      const bucket = this.storage.bucket(this.bucketName);

      // Liste tous les fichiers dans le bucket avec le préfixe de session
      const [files] = await bucket.getFiles({ prefix: this.sessionPath });
      
      if (files.length === 0) {
        console.log("ℹ️ Aucune session WhatsApp trouvée dans Object Storage");
        return false;
      }

      // Crée le dossier local s'il n'existe pas
      if (!fs.existsSync(localAuthDir)) {
        await mkdir(localAuthDir, { recursive: true });
      }

      // Télécharge chaque fichier
      for (const file of files) {
        // Extrait le chemin relatif du fichier
        const relativePath = file.name.replace(`${this.sessionPath}/`, "");
        if (!relativePath) continue; // Skip le dossier racine
        
        const localPath = path.join(localAuthDir, relativePath);
        
        // Crée les sous-dossiers si nécessaire
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }

        // Télécharge le fichier
        await file.download({ destination: localPath });
        console.log(`  ✓ Restauré: ${relativePath}`);
      }

      console.log("✅ Sessions WhatsApp restaurées depuis Object Storage");
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la restauration des sessions WhatsApp:", error);
      return false;
    }
  }

  /**
   * Upload récursif d'un dossier vers un bucket
   */
  private async uploadDirectory(
    localDir: string,
    bucket: any,
    remotePrefix: string
  ): Promise<void> {
    const entries = await readdir(localDir);

    for (const entry of entries) {
      const localPath = path.join(localDir, entry);
      const remotePath = `${remotePrefix}/${entry}`;
      const stats = await stat(localPath);

      if (stats.isDirectory()) {
        // Récursif pour les sous-dossiers
        await this.uploadDirectory(localPath, bucket, remotePath);
      } else {
        // Upload du fichier
        await bucket.upload(localPath, {
          destination: remotePath,
          metadata: {
            cacheControl: "private, max-age=0",
          },
        });
        console.log(`  ✓ Sauvegardé: ${entry}`);
      }
    }
  }

  /**
   * Vérifie si des sessions existent dans Object Storage
   */
  async hasStoredSession(): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ 
        prefix: this.sessionPath,
        maxResults: 1 
      });
      return files.length > 0;
    } catch (error) {
      console.error("❌ Erreur lors de la vérification des sessions:", error);
      return false;
    }
  }
}
