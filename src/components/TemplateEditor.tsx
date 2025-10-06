import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  Save, 
  Upload, 
  X, 
  Palette, 
  Type, 
  Image as ImageIcon,
  FileText,
  Eye,
  Settings,
  Building,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { InvoiceTemplate } from '../types';

interface TemplateEditorProps {
  template: InvoiceTemplate | null;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  company_address: z.string().optional(),
  company_email: z.string().email('Invalid email').optional().or(z.literal('')),
  company_phone: z.string().optional(),
  company_website: z.string().optional(),
  primary_color: z.string().min(1, 'Primary color is required'),
  secondary_color: z.string().optional(),
  font_family: z.string().min(1, 'Font family is required'),
  logo_url: z.string().optional(),
  header_text: z.string().optional(),
  footer_text: z.string().optional(),
  terms_conditions: z.string().optional(),
  is_default: z.boolean().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  isEditing,
  onSave,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(template?.logo_url || null);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      company_name: template?.company_name || '',
      company_address: template?.company_address || '',
      company_email: template?.company_email || '',
      company_phone: template?.company_phone || '',
      company_website: template?.company_website || '',
      primary_color: template?.primary_color || '#3B82F6',
      secondary_color: template?.secondary_color || '#6B7280',
      font_family: template?.font_family || 'Inter',
      logo_url: template?.logo_url || '',
      header_text: template?.header_text || '',
      footer_text: template?.footer_text || 'Thank you for your business!',
      terms_conditions: template?.terms_conditions || 'Payment is due within 30 days of invoice date.',
      is_default: template?.is_default || false,
    },
  });

  // Watch form values for live preview
  const watchedValues = watch();

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { error } = await supabase
        .from('invoice_templates')
        .insert([{
          ...data,
          logo_url: logoPreview,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success('Template created successfully!');
      onSave();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!template) throw new Error('No template to update');
      
      const { error } = await supabase
        .from('invoice_templates')
        .update({
          ...data,
          logo_url: logoPreview,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success('Template updated successfully!');
      onSave();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Logo file size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setValue('logo_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: TemplateFormData) => {
    if (isEditing) {
      updateTemplateMutation.mutate(data);
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Roboto', label: 'Roboto' },
  ];

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Template Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Template Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Professional Blue"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_default')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Set as default template
                </label>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  {...register('company_name')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Your Company Name"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.company_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  {...register('company_email')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="contact@company.com"
                />
                {errors.company_email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.company_email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone
                </label>
                <input
                  type="text"
                  {...register('company_phone')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  {...register('company_website')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="www.company.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Address
                </label>
                <textarea
                  {...register('company_address')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="123 Business St, Suite 100&#10;City, State 12345&#10;Country"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" />
              Company Logo
            </h3>
            
            <div className="flex items-center space-x-4">
              {logoPreview && (
                <div className="flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-16 object-contain border border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                </button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG up to 2MB. Recommended size: 200x80px
                </p>
              </div>
            </div>
          </div>

          {/* Design Customization */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Design & Colors
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Color *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    {...register('primary_color')}
                    className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    {...register('primary_color')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="#3B82F6"
                  />
                </div>
                {errors.primary_color && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.primary_color.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    {...register('secondary_color')}
                    className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    {...register('secondary_color')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="#6B7280"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Type className="inline h-4 w-4 mr-1" />
                  Font Family *
                </label>
                <select
                  {...register('font_family')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
                {errors.font_family && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.font_family.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Customization */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Content & Text
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Header Text
                </label>
                <input
                  type="text"
                  {...register('header_text')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Professional Development Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Footer Text
                </label>
                <textarea
                  {...register('footer_text')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Thank you for your business!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  {...register('terms_conditions')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Payment is due within 30 days of invoice date. Late payments may incur additional fees."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Live Preview Panel */}
      {showPreview && (
        <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Live Preview</h3>
          <div 
            className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto"
            style={{ 
              fontFamily: watchedValues.font_family,
              color: watchedValues.secondary_color 
            }}
          >
            {/* Header */}
            <div className="border-b pb-4 mb-4" style={{ borderColor: watchedValues.primary_color }}>
              <div className="flex items-center justify-between">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="h-12 object-contain" />
                )}
                <div className="text-right">
                  <h1 
                    className="text-2xl font-bold"
                    style={{ color: watchedValues.primary_color }}
                  >
                    {watchedValues.company_name || 'Company Name'}
                  </h1>
                  {watchedValues.header_text && (
                    <p className="text-sm text-gray-600">{watchedValues.header_text}</p>
                  )}
                </div>
              </div>
              
              {watchedValues.company_address && (
                <div className="mt-2 text-sm">
                  <pre className="whitespace-pre-wrap">{watchedValues.company_address}</pre>
                </div>
              )}
              
              <div className="mt-2 text-sm space-y-1">
                {watchedValues.company_email && (
                  <div>Email: {watchedValues.company_email}</div>
                )}
                {watchedValues.company_phone && (
                  <div>Phone: {watchedValues.company_phone}</div>
                )}
                {watchedValues.company_website && (
                  <div>Web: {watchedValues.company_website}</div>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="mb-4">
              <h2 
                className="text-xl font-bold mb-2"
                style={{ color: watchedValues.primary_color }}
              >
                INVOICE #001
              </h2>
              <div className="text-sm space-y-1">
                <div>Issue Date: {new Date().toLocaleDateString()}</div>
                <div>Due Date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Sample Items */}
            <div className="mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: watchedValues.primary_color + '20' }}>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2">Web Development</td>
                    <td className="text-right p-2">$2,500.00</td>
                  </tr>
                  <tr>
                    <td className="p-2">Design Services</td>
                    <td className="text-right p-2">$1,200.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="border-t pt-2 mb-4">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span style={{ color: watchedValues.primary_color }}>$3,700.00</span>
              </div>
            </div>

            {/* Terms */}
            {watchedValues.terms_conditions && (
              <div className="text-xs text-gray-600 mb-4">
                <strong>Terms & Conditions:</strong>
                <p className="mt-1">{watchedValues.terms_conditions}</p>
              </div>
            )}

            {/* Footer */}
            {watchedValues.footer_text && (
              <div 
                className="text-center text-sm font-medium pt-4 border-t"
                style={{ 
                  color: watchedValues.primary_color,
                  borderColor: watchedValues.primary_color 
                }}
              >
                {watchedValues.footer_text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;