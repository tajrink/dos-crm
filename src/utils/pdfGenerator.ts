import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { InvoiceTemplate } from '../types';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  items: InvoiceItem[];
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export class PDFGenerator {
  private doc: jsPDF;
  private template: InvoiceTemplate | null;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor(template?: InvoiceTemplate) {
    this.doc = new jsPDF();
    this.template = template || null;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  private setFont(size: number, style: 'normal' | 'bold' = 'normal') {
    const fontFamily = this.template?.font_family || 'helvetica';
    this.doc.setFont(fontFamily.toLowerCase(), style);
    this.doc.setFontSize(size);
  }

  private setColor(color?: string) {
    if (color) {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      this.doc.setTextColor(r, g, b);
    } else {
      this.doc.setTextColor(0, 0, 0); // Default black
    }
  }

  private addLogo(yPos: number): number {
    if (this.template?.logo_url) {
      try {
        // For base64 images, we can add them directly
        if (this.template.logo_url.startsWith('data:image/')) {
          this.doc.addImage(
            this.template.logo_url,
            'JPEG',
            this.margin,
            yPos,
            40, // width
            20  // height
          );
          return yPos + 25;
        }
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }
    }
    return yPos;
  }

  private addCompanyHeader(yPos: number): number {
    let currentY = yPos;

    // Add logo if available
    currentY = this.addLogo(currentY);

    // Company name
    this.setFont(20, 'bold');
    this.setColor(this.template?.primary_color);
    const companyName = this.template?.company_name || 'Devs On Steroids';
    this.doc.text(companyName, this.margin, currentY);
    currentY += 10;

    // Header text
    if (this.template?.header_text) {
      this.setFont(12);
      this.setColor(this.template?.secondary_color);
      this.doc.text(this.template.header_text, this.margin, currentY);
      currentY += 8;
    }

    // Company details
    this.setFont(10);
    this.setColor(); // Default color

    if (this.template?.company_address) {
      const addressLines = this.template.company_address.split('\n');
      addressLines.forEach(line => {
        this.doc.text(line.trim(), this.margin, currentY);
        currentY += 5;
      });
    }

    if (this.template?.company_email) {
      this.doc.text(`Email: ${this.template.company_email}`, this.margin, currentY);
      currentY += 5;
    }

    if (this.template?.company_phone) {
      this.doc.text(`Phone: ${this.template.company_phone}`, this.margin, currentY);
      currentY += 5;
    }

    if (this.template?.company_website) {
      this.doc.text(`Web: ${this.template.company_website}`, this.margin, currentY);
      currentY += 5;
    }

    return currentY + 10;
  }

  private addInvoiceTitle(invoice: Invoice, yPos: number): number {
    // Invoice title
    this.setFont(24, 'bold');
    this.setColor(this.template?.primary_color);
    this.doc.text('INVOICE', this.pageWidth - this.margin - 40, yPos, { align: 'right' });
    
    // Invoice number
    this.setFont(14);
    this.setColor();
    this.doc.text(`#${invoice.invoice_number}`, this.pageWidth - this.margin - 40, yPos + 10, { align: 'right' });

    return yPos + 25;
  }

  private addInvoiceDetails(invoice: Invoice, yPos: number): number {
    let currentY = yPos;

    // Invoice details section
    this.setFont(12, 'bold');
    this.setColor(this.template?.primary_color);
    this.doc.text('Invoice Details', this.margin, currentY);
    currentY += 8;

    this.setFont(10);
    this.setColor();

    const details = [
      `Issue Date: ${format(new Date(invoice.issue_date), 'MMM dd, yyyy')}`,
      `Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}`,
      `Status: ${invoice.status.toUpperCase()}`,
    ];

    details.forEach(detail => {
      this.doc.text(detail, this.margin, currentY);
      currentY += 6;
    });

    return currentY + 5;
  }

  private addBillToSection(invoice: Invoice, yPos: number): number {
    let currentY = yPos;

    // Bill To section
    this.setFont(12, 'bold');
    this.setColor(this.template?.primary_color);
    this.doc.text('Bill To:', this.pageWidth / 2, currentY);
    currentY += 8;

    this.setFont(10);
    this.setColor();

    if (invoice.client) {
      const clientDetails = [
        invoice.client.name,
        invoice.client.company,
        invoice.client.email,
        invoice.client.phone,
        invoice.client.address,
      ].filter(Boolean);

      clientDetails.forEach(detail => {
        this.doc.text(detail!, this.pageWidth / 2, currentY);
        currentY += 6;
      });
    }

    return currentY + 10;
  }

  private addItemsTable(invoice: Invoice, yPos: number): number {
    let currentY = yPos;

    // Table header
    this.setFont(12, 'bold');
    this.setColor(this.template?.primary_color);
    
    // Header background
    this.doc.setFillColor(
      this.template?.primary_color ? 
        parseInt(this.template.primary_color.substr(1, 2), 16) : 59,
      this.template?.primary_color ? 
        parseInt(this.template.primary_color.substr(3, 2), 16) : 130,
      this.template?.primary_color ? 
        parseInt(this.template.primary_color.substr(5, 2), 16) : 246
    );
    this.doc.setFillColor(240, 240, 240); // Light gray background
    this.doc.rect(this.margin, currentY - 5, this.pageWidth - 2 * this.margin, 12, 'F');

    this.setColor();
    this.doc.text('Description', this.margin + 2, currentY + 2);
    this.doc.text('Qty', this.pageWidth - 120, currentY + 2);
    this.doc.text('Rate', this.pageWidth - 80, currentY + 2);
    this.doc.text('Amount', this.pageWidth - 40, currentY + 2, { align: 'right' });
    
    currentY += 15;

    // Table items
    this.setFont(10);
    invoice.items.forEach(item => {
      this.doc.text(item.description, this.margin + 2, currentY);
      this.doc.text(item.quantity.toString(), this.pageWidth - 120, currentY);
      this.doc.text(`$${item.rate.toFixed(2)}`, this.pageWidth - 80, currentY);
      this.doc.text(`$${item.amount.toFixed(2)}`, this.pageWidth - 40, currentY, { align: 'right' });
      currentY += 8;
    });

    // Add line separator
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, currentY + 2, this.pageWidth - this.margin, currentY + 2);
    currentY += 10;

    return currentY;
  }

  private addTotalsSection(invoice: Invoice, yPos: number): number {
    let currentY = yPos;

    const totalsX = this.pageWidth - 80;

    this.setFont(10);
    this.setColor();

    // Subtotal
    this.doc.text('Subtotal:', totalsX - 40, currentY);
    this.doc.text(`$${invoice.subtotal.toFixed(2)}`, totalsX, currentY, { align: 'right' });
    currentY += 8;

    // Tax
    this.doc.text(`Tax (${(invoice.tax_rate * 100).toFixed(1)}%):`, totalsX - 40, currentY);
    this.doc.text(`$${invoice.tax_amount.toFixed(2)}`, totalsX, currentY, { align: 'right' });
    currentY += 8;

    // Total
    this.setFont(14, 'bold');
    this.setColor(this.template?.primary_color);
    this.doc.text('Total:', totalsX - 40, currentY);
    this.doc.text(`$${invoice.total_amount.toFixed(2)}`, totalsX, currentY, { align: 'right' });
    currentY += 15;

    return currentY;
  }

  private addNotesSection(invoice: Invoice, yPos: number): number {
    if (!invoice.notes) return yPos;

    let currentY = yPos;

    this.setFont(12, 'bold');
    this.setColor(this.template?.primary_color);
    this.doc.text('Notes:', this.margin, currentY);
    currentY += 8;

    this.setFont(10);
    this.setColor();
    
    // Split notes into lines to handle wrapping
    const noteLines = this.doc.splitTextToSize(invoice.notes, this.pageWidth - 2 * this.margin);
    noteLines.forEach((line: string) => {
      this.doc.text(line, this.margin, currentY);
      currentY += 6;
    });

    return currentY + 10;
  }

  private addTermsSection(yPos: number): number {
    if (!this.template?.terms_conditions) return yPos;

    let currentY = yPos;

    this.setFont(12, 'bold');
    this.setColor(this.template?.primary_color);
    this.doc.text('Terms & Conditions:', this.margin, currentY);
    currentY += 8;

    this.setFont(9);
    this.setColor();
    
    const termsLines = this.doc.splitTextToSize(this.template.terms_conditions, this.pageWidth - 2 * this.margin);
    termsLines.forEach((line: string) => {
      this.doc.text(line, this.margin, currentY);
      currentY += 5;
    });

    return currentY + 10;
  }

  private addFooter(): void {
    if (!this.template?.footer_text) return;

    const footerY = this.pageHeight - 30;
    
    // Footer line
    this.doc.setDrawColor(
      this.template?.primary_color ? 
        parseInt(this.template.primary_color.substr(1, 2), 16) : 59,
      this.template?.primary_color ? 
        parseInt(this.template.primary_color.substr(3, 2), 16) : 130,
      this.template?.primary_color ? 
        parseInt(this.template.primary_color.substr(5, 2), 16) : 246
    );
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    // Footer text
    this.setFont(10, 'bold');
    this.setColor(this.template?.primary_color);
    this.doc.text(this.template.footer_text, this.pageWidth / 2, footerY, { align: 'center' });
  }

  public generateInvoicePDF(invoice: Invoice): jsPDF {
    let currentY = 30;

    // Add company header
    currentY = this.addCompanyHeader(currentY);

    // Add invoice title (on the same level as company header)
    this.addInvoiceTitle(invoice, 30);

    // Add invoice details and bill to sections
    const detailsY = this.addInvoiceDetails(invoice, currentY);
    const billToY = this.addBillToSection(invoice, currentY);
    currentY = Math.max(detailsY, billToY);

    // Add items table
    currentY = this.addItemsTable(invoice, currentY);

    // Add totals
    currentY = this.addTotalsSection(invoice, currentY);

    // Add notes
    currentY = this.addNotesSection(invoice, currentY);

    // Add terms
    currentY = this.addTermsSection(currentY);

    // Add footer
    this.addFooter();

    return this.doc;
  }

  public downloadPDF(invoice: Invoice, filename?: string): void {
    this.generateInvoicePDF(invoice);
    const fileName = filename || `invoice-${invoice.invoice_number}.pdf`;
    this.doc.save(fileName);
  }

  public getPDFBlob(invoice: Invoice): Blob {
    this.generateInvoicePDF(invoice);
    return this.doc.output('blob');
  }

  public getPDFDataUri(invoice: Invoice): string {
    this.generateInvoicePDF(invoice);
    return this.doc.output('datauristring');
  }
}

// Utility function to generate PDF with template
export const generateInvoicePDF = async (invoice: Invoice, template?: InvoiceTemplate): Promise<void> => {
  const generator = new PDFGenerator(template);
  generator.downloadPDF(invoice);
};

// Utility function to get PDF blob for email attachments
export const getInvoicePDFBlob = async (invoice: Invoice, template?: InvoiceTemplate): Promise<Blob> => {
  const generator = new PDFGenerator(template);
  return generator.getPDFBlob(invoice);
};