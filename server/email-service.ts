import nodemailer from "nodemailer";
import type { User, TransportRequest, Offer, Report } from "../shared/schema";

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail = "noreply@camionback.com";
  private toEmail = "camionback@gmail.com";
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort ? parseInt(smtpPort) : 587,
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.isConfigured = true;
        console.log("✅ Email service configured successfully");
      } catch (error) {
        console.error("❌ Failed to configure email service:", error);
        this.isConfigured = false;
      }
    } else {
      console.log("⚠️ Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.");
      this.isConfigured = false;
    }
  }

  private async sendEmail(subject: string, htmlContent: string): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      console.log(`📧 [EMAIL SIMULATION] Would send email:
Subject: ${subject}
To: ${this.toEmail}
From: ${this.fromEmail}
(Email service not configured - set SMTP credentials to enable)`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: this.toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ Email sent successfully: ${subject}`);
    } catch (error) {
      console.error(`❌ Failed to send email: ${subject}`, error);
    }
  }

  private getEmailTemplate(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0a2540 0%, #14405e 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px 20px;
    }
    .info-section {
      background: #f8f9fa;
      border-left: 4px solid #0a2540;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .info-row {
      margin: 8px 0;
    }
    .label {
      font-weight: bold;
      color: #0a2540;
      display: inline-block;
      min-width: 150px;
    }
    .value {
      color: #555;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      margin: 10px 0;
    }
    .status-new {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status-pending {
      background: #fff3e0;
      color: #f57c00;
    }
    .status-validated {
      background: #e8f5e9;
      color: #388e3c;
    }
    .status-report {
      background: #ffebee;
      color: #d32f2f;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #0a2540;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 15px 0;
      font-weight: bold;
    }
    .divider {
      border-top: 2px solid #e0e0e0;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚛 CamionBack</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${title}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Cet email est envoyé automatiquement par le système CamionBack.</p>
      <p>Pour toute question, contactez l'équipe d'administration.</p>
      <p style="margin-top: 15px; color: #999;">© ${new Date().getFullYear()} CamionBack - Plateforme logistique marocaine</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  async sendNewRequestEmail(request: TransportRequest, client: User): Promise<void> {
    const subject = `[Commande #${request.referenceId}] Nouvelle demande publiée`;

    const content = `
      <h2 style="color: #0a2540; margin-top: 0;">📦 Nouvelle demande de transport</h2>
      <div class="status-badge status-new">Demande publiée</div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">📋 Informations de la commande</h3>
        <div class="info-row">
          <span class="label">Numéro de commande:</span>
          <span class="value"><strong>${request.referenceId}</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Date de publication:</span>
          <span class="value">${request.createdAt ? new Date(request.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) : 'N/A'}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">👤 Informations client</h3>
        <div class="info-row">
          <span class="label">Nom:</span>
          <span class="value">${client.name}</span>
        </div>
        <div class="info-row">
          <span class="label">ID Client:</span>
          <span class="value">${client.clientId}</span>
        </div>
        <div class="info-row">
          <span class="label">Téléphone:</span>
          <span class="value">${client.phoneNumber}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">📍 Détails du chargement</h3>
        <div class="info-row">
          <span class="label">Ville de départ:</span>
          <span class="value">${request.fromCity}</span>
        </div>
        <div class="info-row">
          <span class="label">Ville d'arrivée:</span>
          <span class="value">${request.toCity}</span>
        </div>
        <div class="info-row">
          <span class="label">Date souhaitée:</span>
          <span class="value">${new Date(request.dateTime).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="info-row">
          <span class="label">Description:</span>
          <span class="value">${request.description || 'Non spécifiée'}</span>
        </div>
        <div class="info-row">
          <span class="label">Type de marchandise:</span>
          <span class="value">${request.goodsType || 'Non spécifié'}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666;">Connectez-vous au tableau de bord pour gérer cette demande</p>
      </div>
    `;

    await this.sendEmail(subject, this.getEmailTemplate("Nouvelle demande de transport", content));
  }

  async sendNewOfferEmail(
    offer: Offer,
    request: TransportRequest,
    transporter: User,
    client: User
  ): Promise<void> {
    const subject = `[Commande #${request.referenceId}] Nouvelle offre reçue`;

    const content = `
      <h2 style="color: #0a2540; margin-top: 0;">💼 Nouvelle offre de transport</h2>
      <div class="status-badge status-pending">Offre envoyée par transporteur</div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">📋 Informations de la commande</h3>
        <div class="info-row">
          <span class="label">Numéro de commande:</span>
          <span class="value"><strong>${request.referenceId}</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Trajet:</span>
          <span class="value">${request.fromCity} → ${request.toCity}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">🚛 Informations transporteur</h3>
        <div class="info-row">
          <span class="label">Nom:</span>
          <span class="value">${transporter.name}</span>
        </div>
        <div class="info-row">
          <span class="label">Téléphone:</span>
          <span class="value">${transporter.phoneNumber}</span>
        </div>
        ${transporter.rating ? `
        <div class="info-row">
          <span class="label">Note:</span>
          <span class="value">${transporter.rating}</span>
        </div>
        ` : ''}
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">💰 Détails de l'offre</h3>
        <div class="info-row">
          <span class="label">Montant proposé:</span>
          <span class="value"><strong style="font-size: 18px; color: #0a2540;">${offer.amount} MAD</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Date d'enlèvement:</span>
          <span class="value">${offer.pickupDate ? new Date(offer.pickupDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Type de chargement:</span>
          <span class="value">${offer.loadType === 'Retour' ? '🔄 Retour à vide' : '📦 Groupage / Partagé'}</span>
        </div>
        <div class="info-row">
          <span class="label">Date de soumission:</span>
          <span class="value">${offer.createdAt ? new Date(offer.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) : 'N/A'}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">👤 Client concerné</h3>
        <div class="info-row">
          <span class="label">Nom:</span>
          <span class="value">${client.name}</span>
        </div>
        <div class="info-row">
          <span class="label">ID Client:</span>
          <span class="value">${client.clientId}</span>
        </div>
        <div class="info-row">
          <span class="label">Téléphone:</span>
          <span class="value">${client.phoneNumber}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666;">Connectez-vous au tableau de bord pour gérer cette offre</p>
      </div>
    `;

    await this.sendEmail(subject, this.getEmailTemplate("Nouvelle offre reçue", content));
  }

  async sendOrderValidatedEmail(
    request: TransportRequest,
    offer: Offer,
    client: User,
    transporter: User
  ): Promise<void> {
    const subject = `[Commande #${request.referenceId}] Commande validée`;

    const content = `
      <h2 style="color: #0a2540; margin-top: 0;">✅ Commande validée et acceptée</h2>
      <div class="status-badge status-validated">Commande validée</div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">📋 Informations de la commande</h3>
        <div class="info-row">
          <span class="label">Numéro de commande:</span>
          <span class="value"><strong>${request.referenceId}</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Trajet:</span>
          <span class="value">${request.fromCity} → ${request.toCity}</span>
        </div>
        <div class="info-row">
          <span class="label">Date de validation:</span>
          <span class="value">${new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">👤 Informations client</h3>
        <div class="info-row">
          <span class="label">Nom:</span>
          <span class="value">${client.name}</span>
        </div>
        <div class="info-row">
          <span class="label">ID Client:</span>
          <span class="value">${client.clientId}</span>
        </div>
        <div class="info-row">
          <span class="label">Téléphone:</span>
          <span class="value">${client.phoneNumber}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">🚛 Informations transporteur</h3>
        <div class="info-row">
          <span class="label">Nom:</span>
          <span class="value">${transporter.name}</span>
        </div>
        <div class="info-row">
          <span class="label">Téléphone:</span>
          <span class="value">${transporter.phoneNumber}</span>
        </div>
        ${transporter.rating ? `
        <div class="info-row">
          <span class="label">Note:</span>
          <span class="value">${transporter.rating}</span>
        </div>
        ` : ''}
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">💰 Détails financiers</h3>
        <div class="info-row">
          <span class="label">Montant final convenu:</span>
          <span class="value"><strong style="font-size: 20px; color: #0a2540;">${offer.amount} MAD</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Date prévue de livraison:</span>
          <span class="value">${offer.pickupDate ? new Date(offer.pickupDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Type de chargement:</span>
          <span class="value">${offer.loadType === 'Retour' ? '🔄 Retour à vide' : '📦 Groupage / Partagé'}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666;">Connectez-vous au tableau de bord pour suivre cette commande</p>
      </div>
    `;

    await this.sendEmail(subject, this.getEmailTemplate("Commande validée", content));
  }

  async sendNewReportEmail(
    report: Report,
    request: TransportRequest,
    reporter: User,
    reported: User
  ): Promise<void> {
    const subject = `[Commande #${request.referenceId}] Nouveau litige signalé`;

    const reporterType = reporter.role === 'client' ? 'Client' : 'Transporteur';
    const reportedType = reported.role === 'client' ? 'Client' : 'Transporteur';

    const content = `
      <h2 style="color: #0a2540; margin-top: 0;">🚨 Nouveau litige signalé</h2>
      <div class="status-badge status-report">En attente de traitement</div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">📋 Informations de la commande</h3>
        <div class="info-row">
          <span class="label">Numéro de commande:</span>
          <span class="value"><strong>${request.referenceId}</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Trajet:</span>
          <span class="value">${request.fromCity} → ${request.toCity}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">⚠️ Détails du signalement</h3>
        <div class="info-row">
          <span class="label">Type de signalement:</span>
          <span class="value"><strong>${reporterType} signale ${reportedType}</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Motif:</span>
          <span class="value"><strong>${report.reason}</strong></span>
        </div>
        <div class="info-row">
          <span class="label">Description:</span>
          <span class="value">${report.details || 'Aucune description fournie'}</span>
        </div>
        <div class="info-row">
          <span class="label">Date du signalement:</span>
          <span class="value">${report.createdAt ? new Date(report.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) : 'N/A'}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">👤 Déclarant (${reporterType})</h3>
        <div class="info-row">
          <span class="label">Nom:</span>
          <span class="value">${reporter.name}</span>
        </div>
        ${reporter.clientId ? `
        <div class="info-row">
          <span class="label">ID Client:</span>
          <span class="value">${reporter.clientId}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="label">Téléphone:</span>
          <span class="value">${reporter.phoneNumber}</span>
        </div>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0a2540;">🎯 Personne signalée (${reportedType})</h3>
        <div class="info-row">
          <span class="label">Nom:</span>
          <span class="value">${reported.name}</span>
        </div>
        ${reported.clientId ? `
        <div class="info-row">
          <span class="label">ID Client:</span>
          <span class="value">${reported.clientId}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="label">Téléphone:</span>
          <span class="value">${reported.phoneNumber}</span>
        </div>
      </div>

      <div style="background: #fff3e0; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #e65100;">
          <strong>⚠️ Action requise:</strong> Ce litige nécessite votre intervention pour résoudre le conflit entre les deux parties.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666;">Connectez-vous au tableau de bord pour traiter ce signalement</p>
      </div>
    `;

    await this.sendEmail(subject, this.getEmailTemplate("Nouveau litige signalé", content));
  }
}

export const emailService = new EmailService();
