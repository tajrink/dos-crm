import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Lead']).optional(),
  reference_source: z.string().optional(),
  reference_details: z.string().optional(),
  proposed_budget: z.number().min(0, 'Proposed budget must be positive').optional(),
  approved_budget: z.number().min(0, 'Approved budget must be positive').optional(),
  probable_start_date: z.string().optional(),
  probable_end_date: z.string().optional(),
  actual_start_date: z.string().optional(),
  actual_end_date: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  notes?: string;
  status?: string;
  reference_source?: string;
  reference_details?: string;
  proposed_budget?: number;
  approved_budget?: number;
  probable_start_date?: string;
  probable_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  created_at: string;
  updated_at: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  mode: 'add' | 'edit';
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client, mode }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      company: client?.company || '',
      address: client?.address || '',
      reference_source: client?.reference_source || '',
      reference_details: client?.reference_details || '',
      proposed_budget: client?.proposed_budget || undefined,
      approved_budget: client?.approved_budget || undefined,
      probable_start_date: client?.probable_start_date || '',
      probable_end_date: client?.probable_end_date || '',
      actual_start_date: client?.actual_start_date || '',
      actual_end_date: client?.actual_end_date || '',
    },
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const { error } = await supabase
        .from('clients')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client added successfully');
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to add client');
      console.error('Add error:', error);
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!client?.id) throw new Error('Client ID is required');
      
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', client.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update client');
      console.error('Update error:', error);
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (mode === 'add') {
      addClientMutation.mutate(data);
    } else {
      updateClientMutation.mutate(data);
    }
  };

  const isLoading = addClientMutation.isPending || updateClientMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'add' ? 'Add New Client' : 'Edit Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter client name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company
            </label>
            <input
              {...register('company')}
              type="text"
              id="company"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter company name"
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              {...register('website')}
              type="url"
              id="website"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.website.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              {...register('address')}
              id="address"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              id="status"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select status</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Additional notes about the client"
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notes.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reference_source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reference Source
            </label>
            <select
              {...register('reference_source')}
              id="reference_source"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select reference source</option>
              <option value="referral">Referral (existing client)</option>
              <option value="social_media">Social Media</option>
              <option value="website">Website</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="networking_event">Networking Event</option>
              <option value="partner_agency">Partner/Agency</option>
              <option value="direct_contact">Direct Contact</option>
              <option value="other">Other</option>
            </select>
            {errors.reference_source && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reference_source.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reference_details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reference Details
            </label>
            <textarea
              {...register('reference_details')}
              id="reference_details"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter specific details about the reference (optional)"
            />
            {errors.reference_details && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reference_details.message}</p>
            )}
          </div>

          {/* Budget Fields */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Budget</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="proposed_budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proposed Budget
                </label>
                <input
                  {...register('proposed_budget', { valueAsNumber: true })}
                  type="number"
                  id="proposed_budget"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
                {errors.proposed_budget && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.proposed_budget.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="approved_budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Approved Budget
                </label>
                <input
                  {...register('approved_budget', { valueAsNumber: true })}
                  type="number"
                  id="approved_budget"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
                {errors.approved_budget && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.approved_budget.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Fields */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Timeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="probable_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Probable Start Date
                </label>
                <input
                  {...register('probable_start_date')}
                  type="date"
                  id="probable_start_date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.probable_start_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.probable_start_date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="probable_end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Probable End Date
                </label>
                <input
                  {...register('probable_end_date')}
                  type="date"
                  id="probable_end_date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.probable_end_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.probable_end_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="actual_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actual Start Date <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  {...register('actual_start_date')}
                  type="date"
                  id="actual_start_date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.actual_start_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actual_start_date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="actual_end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actual End Date <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  {...register('actual_end_date')}
                  type="date"
                  id="actual_end_date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.actual_end_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actual_end_date.message}</p>
                )}
              </div>
            </div>
          </div>

          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : mode === 'add' ? 'Add Client' : 'Update Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientModal;