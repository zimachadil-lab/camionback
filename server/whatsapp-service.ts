import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const { Client, LocalAuth } = pkg;

class WhatsAppService {
  private client: Client | null = null;
  private isReady = false;
  private isInitializing = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    if (this.isInitializing || this.client) {
      return;
    }

    this.isInitializing = true;

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: '.wwebjs_auth',
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      });

      // QR Code generation
      this.client.on('qr', (qr) => {
        console.log('\n🔐 Scan ce QR code pour connecter WhatsApp Business (+212664373534):');
        qrcode.generate(qr, { small: true });
        console.log('\n📱 Ouvrez WhatsApp sur votre téléphone → Appareils liés → Lier un appareil\n');
      });

      // Ready event
      this.client.on('ready', () => {
        console.log('✅ WhatsApp Business est connecté et prêt !');
        this.isReady = true;
        this.isInitializing = false;
      });

      // Authenticated event
      this.client.on('authenticated', () => {
        console.log('✅ WhatsApp Business authentifié avec succès');
      });

      // Authentication failure
      this.client.on('auth_failure', (msg) => {
        console.error('❌ Échec d\'authentification WhatsApp:', msg);
        this.isReady = false;
        this.isInitializing = false;
      });

      // Disconnected event
      this.client.on('disconnected', (reason) => {
        console.log('⚠️ WhatsApp déconnecté:', reason);
        this.isReady = false;
        this.isInitializing = false;
        
        // Attempt to reconnect after 10 seconds
        setTimeout(() => {
          console.log('🔄 Tentative de reconnexion WhatsApp...');
          this.client = null;
          this.initializeClient();
        }, 10000);
      });

      // Initialize the client
      this.client.initialize().catch((error) => {
        console.error('❌ Erreur lors de l\'initialisation de WhatsApp:', error);
        this.isInitializing = false;
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création du client WhatsApp:', error);
      this.isInitializing = false;
    }
  }

  /**
   * Envoie un message WhatsApp à un transporteur
   * @param phoneNumber Numéro au format international (+212...)
   * @param message Contenu du message
   * @returns Promise<boolean> true si envoyé, false sinon
   */
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isReady || !this.client) {
      console.error('⚠️ Client WhatsApp non prêt. Message non envoyé à', phoneNumber);
      return false;
    }

    try {
      // Format le numéro pour WhatsApp (retire le + et ajoute @c.us)
      const formattedNumber = phoneNumber.replace('+', '') + '@c.us';
      
      await this.client.sendMessage(formattedNumber, message);
      console.log(`✅ Message WhatsApp envoyé à ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi du message à ${phoneNumber}:`, error);
      return false;
    }
  }

  /**
   * Envoie une notification de nouvelle commande aux transporteurs actifs
   * @param transporters Liste des transporteurs avec numéro de téléphone
   * @param commandData Données de la commande
   */
  async sendNewCommandNotifications(
    transporters: Array<{ id: string; phoneNumber: string; name: string | null }>,
    commandData: {
      referenceId: string;
      fromCity: string;
      toCity: string;
      dateTime: Date;
      budget: string | null;
      goodsType: string;
      commandId: string;
    }
  ): Promise<Array<{ transporterId: string; phoneNumber: string; success: boolean; errorMessage?: string }>> {
    const results: Array<{ transporterId: string; phoneNumber: string; success: boolean; errorMessage?: string }> = [];

    for (const transporter of transporters) {
      // Délai de 1 seconde entre chaque envoi pour éviter le blocage
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const message = this.buildCommandMessage(commandData);
      const success = await this.sendMessage(transporter.phoneNumber, message);

      results.push({
        transporterId: transporter.id,
        phoneNumber: transporter.phoneNumber,
        success,
        errorMessage: success ? undefined : 'Échec d\'envoi',
      });

      if (success) {
        console.log(`✅ Message envoyé à ${transporter.name || 'Transporteur'} (${transporter.phoneNumber}) pour commande ${commandData.referenceId}`);
      }
    }

    return results;
  }

  /**
   * Construit le message formaté pour une nouvelle commande
   */
  buildCommandMessage(commandData: {
    referenceId: string;
    fromCity: string;
    toCity: string;
    dateTime: Date;
    budget: string | null;
    goodsType: string;
    commandId: string;
  }): string {
    const formattedDate = new Date(commandData.dateTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const commandUrl = `https://camionback.com/commande/${commandData.commandId}`;

    return `🚛 *Nouvelle commande disponible sur CamionBack !*

📍 Ville de départ : ${commandData.fromCity}
🎯 Ville d'arrivée : ${commandData.toCity}
🗓️ Date souhaitée : ${formattedDate}
${commandData.budget ? `💰 Prix proposé : ${commandData.budget} MAD` : ''}
📦 Type de marchandise : ${commandData.goodsType}

👉 Cliquez ici pour voir la commande :
🔗 ${commandUrl}

Ne laissez pas votre camion revenir à vide !
🌐 www.camionback.com`;
  }

  /**
   * Vérifie si le service est prêt
   */
  isServiceReady(): boolean {
    return this.isReady;
  }

  /**
   * Déconnecte le client WhatsApp
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      console.log('WhatsApp Business déconnecté');
    }
  }
}

// Export une instance unique (singleton)
export const whatsappService = new WhatsAppService();
