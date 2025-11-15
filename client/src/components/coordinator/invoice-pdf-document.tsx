import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { InvoiceData, formatHandlingDetails, formatCurrency } from '@/lib/invoice-utils';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #0d9488',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: 5,
  },
  companySubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 15,
    marginBottom: 5,
  },
  invoiceInfo: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: '1 solid #e2e8f0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '35%',
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  value: {
    width: '65%',
    fontSize: 10,
    color: '#1e293b',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    width: '48%',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: '1 solid #e2e8f0',
  },
  gridTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: 6,
  },
  gridRow: {
    marginBottom: 3,
  },
  gridLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  gridValue: {
    fontSize: 10,
    color: '#1e293b',
    marginTop: 2,
  },
  totalSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ecfeff',
    borderRadius: 4,
    border: '2 solid #0d9488',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d9488',
  },
  paymentSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    border: '1 solid #fbbf24',
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  paymentText: {
    fontSize: 9,
    color: '#78350f',
    marginBottom: 3,
  },
  ribBox: {
    marginTop: 5,
    padding: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 3,
    border: '1 solid #fbbf24',
  },
  ribLabel: {
    fontSize: 9,
    color: '#92400e',
    marginBottom: 3,
  },
  ribValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350f',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 15,
    paddingTop: 8,
    borderTop: '1 solid #e2e8f0',
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#ecfeff',
    color: '#0e7490',
    padding: 4,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
});

interface InvoicePdfDocumentProps {
  invoice: InvoiceData;
}

// Helper to truncate text to fit within 2 lines (approx 100 chars for PDF width)
const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export function InvoicePdfDocument({ invoice }: InvoicePdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>CamionBack</Text>
          <Text style={styles.companySubtitle}>Plateforme de logistique - Maroc</Text>
        </View>

        {/* Invoice Title & Info */}
        <View>
          <Text style={styles.invoiceTitle}>FACTURE</Text>
          <Text style={styles.invoiceInfo}>Numéro: {invoice.invoiceNumber}</Text>
          <Text style={styles.invoiceInfo}>Date: {invoice.invoiceDate}</Text>
          <Text style={styles.invoiceInfo}>Référence commande: {invoice.requestReference}</Text>
        </View>

        {/* Client & Transporter Info Grid */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>CLIENT</Text>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Nom</Text>
              <Text style={styles.gridValue}>{invoice.clientName}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Téléphone</Text>
              <Text style={styles.gridValue}>{invoice.clientPhone}</Text>
            </View>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>TRANSPORTEUR</Text>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Nom</Text>
              <Text style={styles.gridValue}>{invoice.transporterName}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Téléphone</Text>
              <Text style={styles.gridValue}>{invoice.transporterPhone}</Text>
            </View>
          </View>
        </View>

        {/* Transport Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du Transport</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Ville de départ:</Text>
            <Text style={styles.value}>{invoice.fromCity}</Text>
          </View>
          
          {invoice.departureAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>Adresse départ:</Text>
              <Text style={styles.value}>{invoice.departureAddress}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Ville d'arrivée:</Text>
            <Text style={styles.value}>{invoice.toCity}</Text>
          </View>
          
          {invoice.arrivalAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>Adresse arrivée:</Text>
              <Text style={styles.value}>{invoice.arrivalAddress}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Date de prise en charge:</Text>
            <Text style={styles.value}>{invoice.pickupDate}</Text>
          </View>
          
          {invoice.distance && (
            <View style={styles.row}>
              <Text style={styles.label}>Distance estimée:</Text>
              <Text style={styles.value}>{invoice.distance} km</Text>
            </View>
          )}
        </View>

        {/* Goods Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description de la Marchandise</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Type de marchandise:</Text>
            <Text style={styles.value}>{invoice.goodsType}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{truncateText(invoice.description, 100)}</Text>
          </View>
        </View>

        {/* Handling Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manutention</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Manutention requise:</Text>
            <Text style={styles.value}>{formatHandlingDetails(invoice)}</Text>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>MONTANT TOTAL À PAYER</Text>
            <Text style={styles.totalAmount}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* Payment Instructions */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Instructions de Paiement</Text>
          <Text style={styles.paymentText}>Mode de paiement: {invoice.paymentMethod}</Text>
          <Text style={styles.paymentText}>{invoice.paymentInstructions}</Text>
          <Text style={styles.paymentText}>À libeller au nom de: CamionBack</Text>
          
          <View style={styles.ribBox}>
            <Text style={styles.ribLabel}>RIB (Relevé d'Identité Bancaire):</Text>
            <Text style={styles.ribValue}>{invoice.rib}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>CamionBack - Marketplace logistique Maroc</Text>
          <Text style={{ marginTop: 3 }}>Document généré le {invoice.invoiceDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
