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
    console.log(`⚠️ SMS non envoyé à ${to} - Infobip non configuré`);
    console.log(`   Message : ${message}`);
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
      console.error(`❌ Erreur Infobip (${response.status}):`, errorText);
      return false;
    }
    
    const result = await response.json();
    console.log(`✅ SMS envoyé avec succès à ${formattedNumber} via Infobip`);
    console.log(`   ID Message:`, result.messages?.[0]?.messageId || 'N/A');
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi SMS à ${to}:`, error);
    return false;
  }
}

/**
 * Send SMS to client when they receive their first offer
 */
export async function sendFirstOfferSMS(clientPhone: string): Promise<boolean> {
  const message = `🚛 Vous avez reçu une nouvelle offre de transport sur CamionBack. Connectez-vous pour la consulter et réserver votre camion.`;
  
  // Fire and forget - don't block the main process
  sendSMS(clientPhone, message).catch(err => {
    console.error('Erreur SMS première offre:', err);
  });
  
  return true;
}

/**
 * Send SMS to transporter when their offer is accepted
 */
export async function sendOfferAcceptedSMS(transporterPhone: string): Promise<boolean> {
  const message = `✅ Votre offre de transport sur CamionBack a été acceptée ! Contactez votre client depuis votre tableau de bord.`;
  
  // Fire and forget - don't block the main process
  sendSMS(transporterPhone, message).catch(err => {
    console.error('Erreur SMS offre acceptée:', err);
  });
  
  return true;
}

/**
 * Send SMS to transporter when their account is activated by admin
 */
export async function sendTransporterActivatedSMS(transporterPhone: string): Promise<boolean> {
  const message = `🚛 Bonjour ! Votre compte CamionBack est maintenant activé. Vous pouvez dès à présent consulter les commandes disponibles et proposer vos offres. – L'équipe CamionBack`;
  
  // Fire and forget - don't block the main process
  sendSMS(transporterPhone, message).catch(err => {
    console.error('Erreur SMS activation transporteur:', err);
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
    console.log(`⚠️ SMS en masse non envoyés - Infobip non configuré`);
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
        console.error(`❌ Erreur Infobip batch ${i / BATCH_SIZE + 1} (${response.status}):`, errorText);
        failedCount += batch.length;
      } else {
        const result = await response.json();
        successCount += batch.length;
        console.log(`✅ Batch ${i / BATCH_SIZE + 1}: ${batch.length} SMS envoyés via Infobip`);
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi du batch ${i / BATCH_SIZE + 1}:`, error);
      failedCount += batch.length;
    }
  }
  
  console.log(`📊 Envoi en masse terminé: ${successCount} réussis, ${failedCount} échecs`);
  return { success: successCount, failed: failedCount };
}

// Log configuration status on startup
if (isInfobipConfigured()) {
  console.log("✅ Service SMS Infobip configuré avec succès");
  console.log(`   URL de base: ${VALIDATED_INFOBIP_BASE_URL}`);
  console.log(`   Expéditeur: ${SENDER_NAME}`);
} else {
  console.log("⚠️ Service SMS Infobip non configuré");
  console.log("   Configurez INFOBIP_API_KEY et INFOBIP_BASE_URL pour activer les SMS");
}
