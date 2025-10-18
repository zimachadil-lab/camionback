import twilio from "twilio";

// Twilio client - will be undefined if credentials are not set
let twilioClient: ReturnType<typeof twilio> | null = null;

// Initialize Twilio client if credentials are available
function initializeTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid && authToken) {
    try {
      twilioClient = twilio(accountSid, authToken);
      console.log("✅ Twilio client initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing Twilio client:", error);
    }
  } else {
    console.log("⚠️ Twilio credentials not found. SMS notifications will be disabled.");
    console.log("   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable SMS.");
  }
}

// Initialize on module load
initializeTwilioClient();

/**
 * Convert Moroccan phone number to international format
 * Converts 06xxxxx to +2126xxxxx or 07xxxxx to +2127xxxxx
 */
function formatMoroccanPhone(phoneNumber: string): string {
  // Remove any spaces or special characters
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If already in international format, return as is
  if (cleaned.startsWith('+212')) {
    return cleaned;
  }
  
  // If starts with 0, convert to +212
  if (cleaned.startsWith('0')) {
    return `+212${cleaned.slice(1)}`;
  }
  
  // If starts with 6 or 7 (without leading 0), add +212
  if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
    return `+212${cleaned}`;
  }
  
  // Default: assume it needs +212 prefix
  return `+212${cleaned}`;
}

/**
 * Send SMS via Twilio
 * @param to - Phone number in any format (will be converted to +212...)
 * @param message - SMS message body
 * @returns true if sent successfully, false otherwise
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  // Check if Twilio is configured
  if (!twilioClient) {
    console.log(`⚠️ SMS not sent to ${to} - Twilio not configured`);
    console.log(`   Message would have been: ${message}`);
    return false;
  }
  
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  if (!twilioPhone) {
    console.error("❌ TWILIO_PHONE_NUMBER not set");
    return false;
  }
  
  try {
    const formattedNumber = formatMoroccanPhone(to);
    
    await twilioClient.messages.create({
      from: twilioPhone,
      to: formattedNumber,
      body: message,
    });
    
    console.log(`✅ SMS sent successfully to ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending SMS to ${to}:`, error);
    return false;
  }
}

/**
 * Send SMS to client when they receive their first offer
 */
export async function sendFirstOfferSMS(clientPhone: string): Promise<boolean> {
  const message = `🚚 CamionBack : Vous avez reçu une nouvelle offre de chargement !
Consultez votre compte CamionBack dès maintenant pour bloquer votre camion au meilleur prix.`;
  
  return sendSMS(clientPhone, message);
}

/**
 * Send SMS to transporter when their offer is accepted
 */
export async function sendOfferAcceptedSMS(
  transporterPhone: string,
  commandReference: string
): Promise<boolean> {
  const message = `✅ CamionBack : Félicitations !
Votre offre sur la commande ${commandReference} a été acceptée.
Contactez le client dès que possible pour organiser le transport.`;
  
  return sendSMS(transporterPhone, message);
}
