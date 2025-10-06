import React from 'react';
import { X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { InvoiceTemplate } from '../../types';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  issue_date: string;
  due_date: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  template?: InvoiceTemplate;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  template
}) => {
  const handleDownload = async () => {
    try {
      await generateInvoicePDF(invoice, template);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!isOpen) return null;

  // Use template values or defaults
  const companyName = template?.company_name || 'Devs On Steroids';
  const companyAddress = template?.company_address || '123 Tech Street, Innovation City, IC 12345';
  const companyEmail = template?.company_email || 'contact@devsonsteroids.com';
  const companyPhone = template?.company_phone || '+1 (555) 123-4567';
  const companyWebsite = template?.company_website;
  const primaryColor = template?.primary_color || '#3B82F6';
  const secondaryColor = template?.secondary_color || '#6B7280';
  const fontFamily = template?.font_family || 'Inter, system-ui, sans-serif';
  const headerText = template?.header_text;
  const footerText = template?.footer_text;
  const termsConditions = template?.terms_conditions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Invoice Preview - {invoice.invoice_number}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Invoice Preview Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div 
            className="bg-white shadow-lg mx-auto max-w-3xl p-8"
            style={{ fontFamily }}
          >
            {/* Company Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
                {/* Logo placeholder */}
                {template?.logo_url && (
                  <div className="mb-4">
                    <img 
                      src={template.logo_url} 
                      alt="Company Logo" 
                      className="h-16 w-auto"
                    />
                  </div>
                )}
                
                {/* Company Name */}
                <h1 
                  className="text-2xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  {companyName}
                </h1>
                
                {/* Header Text */}
                {headerText && (
                  <p 
                    className="text-sm mb-3"
                    style={{ color: secondaryColor }}
                  >
                    {headerText}
                  </p>
                )}
                
                {/* Company Details */}
                <div className="text-sm text-gray-600 space-y-1">
                  {companyAddress && (
                    <div>
                      {companyAddress.split('\n').map((line, index) => (
                        <div key={index}>{line.trim()}</div>
                      ))}
                    </div>
                  )}
                  {companyEmail && <div>Email: {companyEmail}</div>}
                  {companyPhone && <div>Phone: {companyPhone}</div>}
                  {companyWebsite && <div>Web: {companyWebsite}</div>}
                </div>
              </div>

              {/* Invoice Title */}
              <div className="text-right">
                <h2 
                  className="text-3xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  INVOICE
                </h2>
                <p className="text-lg font-medium text-gray-700">
                  #{invoice.invoice_number}
                </p>
              </div>
            </div>

            {/* Invoice Details and Bill To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Invoice Details */}
              <div>
                <h3 
                  className="text-lg font-bold mb-3"
                  style={{ color: primaryColor }}
                >
                  Invoice Details
                </h3>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Issue Date:</span>{' '}
                    {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="font-medium">Due Date:</span>{' '}
                    {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className="uppercase font-bold">{invoice.status}</span>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div>
                <h3 
                  className="text-lg font-bold mb-3"
                  style={{ color: primaryColor }}
                >
                  Bill To:
                </h3>
                {invoice.client && (
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{invoice.client.name}</div>
                    {invoice.client.company && (
                      <div>{invoice.client.company}</div>
                    )}
                    {invoice.client.email && (
                      <div>{invoice.client.email}</div>
                    )}
                    {invoice.client.phone && (
                      <div>{invoice.client.phone}</div>
                    )}
                    {invoice.client.address && (
                      <div>{invoice.client.address}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr 
                    className="text-left"
                    style={{ backgroundColor: primaryColor + '20' }}
                  >
                    <th className="p-3 font-bold text-gray-800">Description</th>
                    <th className="p-3 font-bold text-gray-800 text-center">Qty</th>
                    <th className="p-3 font-bold text-gray-800 text-right">Rate</th>
                    <th className="p-3 font-bold text-gray-800 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">${item.rate.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(invoice.tax_rate * 100).toFixed(1)}%):</span>
                    <span>${invoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div 
                    className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300"
                    style={{ color: primaryColor }}
                  >
                    <span>Total:</span>
                    <span>${invoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {invoice.notes && (
              <div className="mb-8">
                <h3 
                  className="text-lg font-bold mb-3"
                  style={{ color: primaryColor }}
                >
                  Notes:
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {invoice.notes}
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            {termsConditions && (
              <div className="mb-8">
                <h3 
                  className="text-lg font-bold mb-3"
                  style={{ color: primaryColor }}
                >
                  Terms & Conditions:
                </h3>
                <div className="text-xs text-gray-600 whitespace-pre-wrap">
                  {termsConditions}
                </div>
              </div>
            )}

            {/* Footer */}
            {footerText && (
              <div className="border-t border-gray-300 pt-4 mt-8">
                <div 
                  className="text-center text-sm font-bold"
                  style={{ color: primaryColor }}
                >
                  {footerText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;