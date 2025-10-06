import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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
  items: InvoiceItem[];
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
}

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  client_id: z.string().min(1, 'Client is required'),
  project_id: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  tax_rate: z.number().min(0).max(1, 'Tax rate must be between 0 and 100%'),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    rate: z.number().min(0, 'Rate must be positive'),
    amount: z.number().min(0, 'Amount must be positive'),
  })).min(1, 'At least one item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  mode: 'add' | 'edit';
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoice, mode }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = React.useState<InvoiceItem[]>([{
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
  }]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_number: '',
      client_id: '',
      project_id: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
      tax_rate: 0.1, // 10% default
      notes: '',
      items: [],
    },
  });

  const watchedClientId = watch('client_id');
  const watchedTaxRate = watch('tax_rate');

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, company')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch projects for selected client
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', watchedClientId],
    queryFn: async () => {
      if (!watchedClientId) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_id')
        .eq('client_id', watchedClientId)
        .order('name');
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!watchedClientId,
  });

  // Calculate totals
  const subtotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  }, [items]);

  const taxAmount = React.useMemo(() => {
    return subtotal * watchedTaxRate;
  }, [subtotal, watchedTaxRate]);

  const totalAmount = React.useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  // Update item amount when quantity or rate changes
  const updateItemAmount = (index: number, field: 'quantity' | 'rate', value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    setItems(newItems);
    setValue('items', newItems);
  };

  const updateItemDescription = (index: number, description: string) => {
    const newItems = [...items];
    newItems[index].description = description;
    setItems(newItems);
    setValue('items', newItems);
  };

  const addItem = () => {
    const newItems = [...items, {
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    }];
    setItems(newItems);
    setValue('items', newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setValue('items', newItems);
    }
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  // Create/Update invoice mutation
  const invoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const invoiceData = {
        invoice_number: data.invoice_number,
        client_id: data.client_id,
        project_id: data.project_id || null,
        issue_date: data.issue_date,
        due_date: data.due_date,
        status: 'Draft' as const,
        subtotal,
        tax_rate: data.tax_rate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      };

      if (mode === 'edit' && invoice) {
        // Update invoice
        const { data: updatedInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoice.id)
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoice.id);

        if (deleteError) throw deleteError;

        // Insert new items
        const itemsData = data.items.map(item => ({
          invoice_id: invoice.id,
          item_name: item.description,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsData);

        if (itemsError) throw itemsError;

        return updatedInvoice;
      } else {
        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            ...invoiceData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Insert items
        const itemsData = data.items.map(item => ({
          invoice_id: newInvoice.id,
          item_name: item.description,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsData);

        if (itemsError) throw itemsError;

        return newInvoice;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Invoice ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || `Failed to ${mode} invoice`);
    },
  });

  // Reset form when modal opens/closes or invoice changes
  React.useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && invoice) {
        reset({
          invoice_number: invoice.invoice_number,
          client_id: invoice.client_id,
          project_id: invoice.project_id || '',
          issue_date: format(new Date(invoice.issue_date), 'yyyy-MM-dd'),
          due_date: format(new Date(invoice.due_date), 'yyyy-MM-dd'),
          tax_rate: invoice.tax_rate,
          notes: invoice.notes || '',
          items: invoice.items,
        });
        setItems(invoice.items);
      } else {
        const newInvoiceNumber = generateInvoiceNumber();
        reset({
          invoice_number: newInvoiceNumber,
          client_id: '',
          project_id: '',
          issue_date: format(new Date(), 'yyyy-MM-dd'),
          due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          tax_rate: 0.1,
          notes: '',
          items: [{
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
          }],
        });
        setItems([{
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
        }]);
      }
    }
  }, [isOpen, mode, invoice, reset]);

  const onSubmit = (data: InvoiceFormData) => {
    invoiceMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Number *
              </label>
              <input
                {...register('invoice_number')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="INV-2024-001"
              />
              {errors.invoice_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.invoice_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client *
              </label>
              <select
                {...register('client_id')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.client_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project (Optional)
              </label>
              <select
                {...register('project_id')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={!watchedClientId}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax Rate *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                {...register('tax_rate', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.10"
              />
              {errors.tax_rate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tax_rate.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter as decimal (e.g., 0.10 for 10%)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Date *
              </label>
              <input
                type="date"
                {...register('issue_date')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.issue_date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.issue_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItemDescription(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemAmount(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.rate}
                      onChange={(e) => updateItemAmount(index, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Rate"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={`$${item.amount.toFixed(2)}`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="w-full p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {errors.items && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.items.message}</p>
            )}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Tax ({(watchedTaxRate * 100).toFixed(1)}%):
                </span>
                <span className="font-medium text-gray-900 dark:text-white">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Additional notes or terms..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invoiceMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {invoiceMutation.isPending
                ? (mode === 'edit' ? 'Updating...' : 'Creating...')
                : (mode === 'edit' ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;