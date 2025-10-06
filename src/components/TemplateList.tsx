import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Plus, 
  FileText,
  Palette,
  Building,
  Calendar
} from 'lucide-react';
import { InvoiceTemplate } from '../types';
import ConfirmationModal from './modals/ConfirmationModal';

interface TemplateListProps {
  onEdit: (template: InvoiceTemplate) => void;
  onNew: () => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ onEdit, onNew }) => {
  const queryClient = useQueryClient();
  const [confirmationModal, setConfirmationModal] = React.useState({
    isOpen: false,
    template: null as InvoiceTemplate | null,
  });

  // Fetch templates
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InvoiceTemplate[];
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('invoice_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success('Template deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });

  // Set default template mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // First, unset all templates as default
      await supabase
        .from('invoice_templates')
        .update({ is_default: false });

      // Then set the selected template as default
      const { error } = await supabase
        .from('invoice_templates')
        .update({ is_default: true })
        .eq('id', templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success('Default template updated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update default template');
    },
  });

  const handleDelete = (template: InvoiceTemplate) => {
    if (template.is_default) {
      toast.error('Cannot delete the default template. Please set another template as default first.');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      template: template,
    });
  };

  const handleConfirmDelete = () => {
    if (confirmationModal.template) {
      deleteTemplateMutation.mutate(confirmationModal.template.id);
      setConfirmationModal({ isOpen: false, template: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, template: null });
  };

  const handleSetDefault = (template: InvoiceTemplate) => {
    if (!template.is_default) {
      setDefaultMutation.mutate(template.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          Failed to load templates
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['invoice-templates'] })}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Templates</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your invoice templates and customize your branding
          </p>
        </div>
        <button
          onClick={onNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Template Preview */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div 
                  className="h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: template.primary_color + '10' }}
                >
                  {template.logo_url ? (
                    <img
                      src={template.logo_url}
                      alt="Template logo"
                      className="h-12 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Building className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {template.company_name}
                      </p>
                    </div>
                  )}
                  
                  {/* Color indicator */}
                  <div 
                    className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: template.primary_color }}
                  ></div>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      {template.name}
                      {template.is_default && (
                        <Star className="h-4 w-4 text-yellow-500 ml-2 fill-current" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {template.company_name}
                    </p>
                  </div>
                </div>

                {/* Template Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Palette className="h-3 w-3 mr-1" />
                    <span>{template.font_family}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(template)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit template"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleSetDefault(template)}
                      className={`p-2 rounded-lg transition-colors ${
                        template.is_default
                          ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={template.is_default ? 'Default template' : 'Set as default'}
                      disabled={template.is_default}
                    >
                      {template.is_default ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(template)}
                    disabled={template.is_default}
                    className={`p-2 rounded-lg transition-colors ${
                      template.is_default
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={template.is_default ? 'Cannot delete default template' : 'Delete template'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No templates yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first invoice template to customize your invoices with your company branding and style.
          </p>
          <button
            onClick={onNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Template</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${confirmationModal.template?.name}"? This action cannot be undone.`}
        confirmText="Delete Template"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteTemplateMutation.isPending}
      />
    </div>
  );
};

export default TemplateList;