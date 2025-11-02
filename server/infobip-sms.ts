/**
 * Infobip SMS Service for CamionBack
 * Handles all SMS notifications via Infobip API
 */

const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;
const SENDER_NAME = "CamionBack";

/**
 * Validate and fix BASE_URL format
 */
function getValidatedBaseUrl(): string | undefined {
  if (!INFOBIP_BASE_URL) return undefined;
  
  // If URL doesn't start with http:// or https://, add https://
  if (!INFOBIP_BASE_URL.startsWith('http://') && !INFOBIP_BASE_URL.startsWith('https://')) {
    return `https://${INFOBIP_BASE_URL}`;
  }
  
  return INFOBIP_BASE_URL;
}

const VALIDATED_INFOBIP_BASE_URL = getValidatedBaseUrl();

/**
 * Check if Infobip is properly configured
 */
function isInfobipConfigured(): boolean {
  return !!(INFOBIP_API_KEY && VALIDATED_INFOBIP_BASE_URL);
}

/**
 * Convert Moroccan phone number to international format
 * Converts 06xxxxx to 2126xxxxx or 07xxxxx to 2127xxxxx
 */
function formatMoroccanPhone(phoneNumber: string): string {
  // Remove any spaces or special characters
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If already in international format with +, remove the +
  if (cleaned.startsWith('+212')) {
    return cleaned.slice(1); // Return 212xxxxxxxx
  }
  
  // If already starts with 212, return as is
  if (cleaned.startsWith('212')) {
    return cleaned;
  }
  
  // If starts with 0, convert to 212
  if (cleaned.startsWith('0')) {
    return `212${cleaned.slice(1)}`;
  }
  
  // If starts with 6 or 7 (without leading 0), add 212
  if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
    return `212${cleaned}`;
  }
  
  // Default: assume it needs 212 prefix
  return `212${cleaned}`;
}

/**
 * Send SMS via Infobip API
 * @param to - Phone number in any format (will be converted to 212...)
 * @param message - SMS message body
 * @returns true if sent successfully, false otherwise
 */
async function sendSMS(to: string, message: string): Promise<boolean> {
  // Check if Infobip is configured
  if (!isInfobipConfigured()) {
    console.log(`[Infobip] SMS non envoye a ${to} - Infobip non configure`);
    console.log(`[Infobip] Message : ${message}`);
    return false;
  }
  
  try {
    const formattedNumber = formatMoroccanPhone(to);
    
    const payload = {
      messages: [
        {
          destinations: [{ to: formattedNumber }],
          from: SENDER_NAME,
          text: message,
        },
      ],
    };
    
    const response = await fetch(`${VALIDATED_INFOBIP_BASE_URL}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Infobip] Erreur (${response.status}):`, errorText);
      return false;
    }
    
    const result = await response.json();
    console.log(`[Infobip] SMS envoye avec succes a ${formattedNumber}`);
    console.log(`[Infobip] ID Message:`, result.messages?.[0]?.messageId || 'N/A');
    return true;
  } catch (error) {
    console.error(`[Infobip] Erreur lors de l'envoi SMS a ${to}:`, error);
    return false;
  }
}

/**
 * Send SMS to client when they receive a new offer
 */
export async function sendNewOfferSMS(clientPhone: string): Promise<boolean> {
  const message = `Vous avez recu une nouvelle proposition tarifaire sur CamionBack. Connectez-vous pour la consulter et choisir votre transporteur.`;
  
  // Fire and forget - don't block the main process
  sendSMS(clientPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS nouvelle offre:', err);
  });
  
  return true;
}

/**
 * Send SMS to transporter when their offer is accepted
 */
export async function sendOfferAcceptedSMS(transporterPhone: string): Promise<boolean> {
  const message = `Votre offre de transport sur CamionBack a ete acceptee ! Contactez votre client depuis votre tableau de bord.`;
  
  // Fire and forget - don't block the main process
  sendSMS(transporterPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS offre acceptee:', err);
  });
  
  return true;
}

/**
 * Send SMS to transporter when their account is activated by admin
 */
export async function sendTransporterActivatedSMS(transporterPhone: string): Promise<boolean> {
  const message = `Bonjour ! Votre compte CamionBack est maintenant active. Vous pouvez des a present consulter les commandes disponibles et proposer vos offres. - L'equipe CamionBack`;
  
  // Fire and forget - don't block the main process
  sendSMS(transporterPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS activation transporteur:', err);
  });
  
  return true;
}

/**
 * Send bulk SMS to multiple recipients
 * Sends in batches to avoid overwhelming the API
 * @param phoneNumbers - Array of phone numbers
 * @param message - SMS message body
 * @returns object with success count and failed count
 */
export async function sendBulkSMS(
  phoneNumbers: string[],
  message: string
): Promise<{ success: number; failed: number }> {
  // Check if Infobip is configured
  if (!isInfobipConfigured()) {
    console.log(`[Infobip] SMS en masse non envoyes - Infobip non configure`);
    return { success: 0, failed: phoneNumbers.length };
  }
  
  const BATCH_SIZE = 50; // Process 50 at a time
  let successCount = 0;
  let failedCount = 0;
  
  // Split into batches
  for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
    const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
    
    try {
      // Format all numbers in batch
      const destinations = batch.map(phone => ({
        to: formatMoroccanPhone(phone)
      }));
      
      const payload = {
        messages: [
          {
            destinations,
            from: SENDER_NAME,
            text: message,
          },
        ],
      };
      
      const response = await fetch(`${VALIDATED_INFOBIP_BASE_URL}/sms/2/text/advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `App ${INFOBIP_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Infobip] Erreur batch ${i / BATCH_SIZE + 1} (${response.status}):`, errorText);
        failedCount += batch.length;
      } else {
        const result = await response.json();
        successCount += batch.length;
        console.log(`[Infobip] Batch ${i / BATCH_SIZE + 1}: ${batch.length} SMS envoyes`);
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`[Infobip] Erreur lors de l'envoi du batch ${i / BATCH_SIZE + 1}:`, error);
      failedCount += batch.length;
    }
  }
  
  console.log(`[Infobip] Envoi en masse termine: ${successCount} reussis, ${failedCount} echecs`);
  return { success: successCount, failed: failedCount };
}

/**
 * Send SMS to transporter when they are manually assigned to a request
 */
export async function sendManualAssignmentSMS(transporterPhone: string, referenceId: string): Promise<boolean> {
  const message = `Vous avez ete assigne a une nouvelle mission ${referenceId} sur CamionBack. Consultez votre tableau de bord pour plus de details.`;
  
  // Fire and forget - don't block the main process
  sendSMS(transporterPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS assignation manuelle:', err);
  });
  
  return true;
}

/**
 * Send SMS to client when a transporter is manually assigned to their request
 */
export async function sendTransporterAssignedSMS(clientPhone: string, referenceId: string): Promise<boolean> {
  const message = `Un transporteur a ete assigne a votre commande ${referenceId} sur CamionBack. Consultez votre tableau de bord pour le contacter.`;
  
  // Fire and forget - don't block the main process
  sendSMS(clientPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS transporteur assigne:', err);
  });
  
  return true;
}

/**
 * Send SMS to client when their request is qualified with pricing
 */
export async function sendRequestQualifiedSMS(clientPhone: string, referenceId: string, clientTotal: number): Promise<boolean> {
  const message = `Votre demande ${referenceId} a ete qualifiee sur CamionBack. Montant total: ${clientTotal} MAD. Consultez votre tableau de bord.`;
  
  // Fire and forget - don't block the main process
  sendSMS(clientPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS demande qualifiee:', err);
  });
  
  return true;
}

/**
 * Send SMS to transporter when a new qualified request is published for matching
 */
export async function sendNewMissionAvailableSMS(transporterPhone: string, referenceId: string): Promise<boolean> {
  const message = `Nouvelle mission ${referenceId} disponible sur CamionBack ! Consultez votre tableau de bord pour exprimer votre interet.`;
  
  // Fire and forget - don't block the main process
  sendSMS(transporterPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS nouvelle mission:', err);
  });
  
  return true;
}

/**
 * Send SMS to client when a transporter expresses interest in their request
 */
export async function sendTransporterInterestedSMS(clientPhone: string, referenceId: string, transporterName: string): Promise<boolean> {
  const message = `${transporterName} est interesse par votre mission ${referenceId} sur CamionBack. Consultez votre tableau de bord pour le contacter.`;
  
  // Fire and forget - don't block the main process
  sendSMS(clientPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS transporteur interesse:', err);
  });
  
  return true;
}

/**
 * Send SMS to client when their request is archived
 */
export async function sendRequestArchivedSMS(clientPhone: string, referenceId: string, reason: string): Promise<boolean> {
  const message = `Votre demande ${referenceId} a ete archivee sur CamionBack. Motif: ${reason}. Contactez le support pour plus d'informations.`;
  
  // Fire and forget - don't block the main process
  sendSMS(clientPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS demande archivee:', err);
  });
  
  return true;
}

/**
 * Send SMS to transporter when client chooses them
 */
export async function sendClientChoseYouSMS(transporterPhone: string, referenceId: string): Promise<boolean> {
  const message = `Felicitations ! Un client vous a choisi pour la mission ${referenceId} sur CamionBack. Consultez votre tableau de bord pour plus de details.`;
  
  // Fire and forget - don't block the main process
  sendSMS(transporterPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS client vous a choisi:', err);
  });
  
  return true;
}

/**
 * Send SMS to client when they select a transporter
 */
export async function sendTransporterSelectedSMS(clientPhone: string, referenceId: string, transporterName: string): Promise<boolean> {
  const message = `Vous avez selectionne ${transporterName} pour votre mission ${referenceId} sur CamionBack. Le transporteur a ete notifie.`;
  
  // Fire and forget - don't block the main process
  sendSMS(clientPhone, message).catch(err => {
    console.error('[Infobip] Erreur SMS transporteur selectionne:', err);
  });
  
  return true;
}

// Log configuration status on startup
if (isInfobipConfigured()) {
  console.log("[Infobip] Service SMS Infobip configure avec succes");
  console.log(`[Infobip] URL de base: ${VALIDATED_INFOBIP_BASE_URL}`);
  console.log(`[Infobip] Expediteur: ${SENDER_NAME}`);
} else {
  console.log("[Infobip] Service SMS Infobip non configure");
  console.log("[Infobip] Configurez INFOBIP_API_KEY et INFOBIP_BASE_URL pour activer les SMS");
}
