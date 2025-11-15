import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  requestReference: string;
  
  // Client info
  clientName: string;
  clientPhone: string;
  clientCity: string;
  
  // Transporter info
  transporterName: string;
  transporterPhone: string;
  transporterCity: string;
  
  // Request details
  fromCity: string;
  toCity: string;
  departureAddress?: string;
  arrivalAddress?: string;
  pickupDate: string;
  description: string;
  goodsType: string;
  distance?: number;
  
  // Handling info
  handlingRequired: boolean;
  departureFloor?: number;
  departureElevator: boolean;
  arrivalFloor?: number;
  arrivalElevator: boolean;
  
  // Pricing
  totalAmount: number;
  
  // Payment instructions
  paymentMethod: string;
  paymentInstructions: string;
  rib: string;
}

export function normalizeInvoiceData(request: any): InvoiceData {
  const now = new Date();
  
  return {
    invoiceNumber: `INV-${request.referenceId || request.id}`,
    invoiceDate: format(now, "dd MMMM yyyy", { locale: fr }),
    requestReference: request.referenceId || request.id,
    
    // Client info
    clientName: request.client?.name || "Client",
    clientPhone: request.client?.phoneNumber || request.client?.phone_number || "N/A",
    clientCity: request.client?.city || "N/A",
    
    // Transporter info
    transporterName: request.transporter?.name || "Transporteur",
    transporterPhone: request.transporter?.phoneNumber || request.transporter?.phone_number || "N/A",
    transporterCity: request.transporter?.city || "N/A",
    
    // Request details
    fromCity: request.fromCity || "N/A",
    toCity: request.toCity || "N/A",
    departureAddress: request.departureAddress,
    arrivalAddress: request.arrivalAddress,
    pickupDate: request.takenInChargeAt 
      ? format(new Date(request.takenInChargeAt), "dd MMMM yyyy à HH:mm", { locale: fr })
      : request.dateTime
        ? format(new Date(request.dateTime), "dd MMMM yyyy à HH:mm", { locale: fr })
        : "N/A",
    description: request.description || "N/A",
    goodsType: request.goodsType || "N/A",
    distance: request.distance,
    
    // Handling info
    handlingRequired: request.handlingRequired || false,
    departureFloor: request.departureFloor,
    departureElevator: request.departureElevator || false,
    arrivalFloor: request.arrivalFloor,
    arrivalElevator: request.arrivalElevator || false,
    
    // Pricing - ONLY show client total (hide platform fee breakdown)
    totalAmount: request.clientTotal || 0,
    
    // Payment instructions
    paymentMethod: "Virement bancaire",
    paymentInstructions: "Paiement à effectuer à la livraison",
    rib: "011815000005210001099713"
  };
}

export function formatHandlingDetails(invoice: InvoiceData): string {
  if (!invoice.handlingRequired) {
    return "Non requise";
  }
  
  const details: string[] = [];
  
  if (invoice.departureFloor !== null && invoice.departureFloor !== undefined) {
    const elevator = invoice.departureElevator ? "avec ascenseur" : "sans ascenseur";
    details.push(`Départ: ${invoice.departureFloor}ème étage (${elevator})`);
  }
  
  if (invoice.arrivalFloor !== null && invoice.arrivalFloor !== undefined) {
    const elevator = invoice.arrivalElevator ? "avec ascenseur" : "sans ascenseur";
    details.push(`Arrivée: ${invoice.arrivalFloor}ème étage (${elevator})`);
  }
  
  return details.length > 0 ? details.join(" | ") : "Requise";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
