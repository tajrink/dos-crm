import React, { useState } from 'react';
import { X } from 'lucide-react';
import { InvoiceTemplate } from '../types';
import TemplateList from './TemplateList';
import TemplateEditor from './TemplateEditor';

interface InvoiceTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceTemplateManager: React.FC<InvoiceTemplateManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setIsEditing(false);
    setActiveTab('editor');
  };

  const handleSave = () => {
    setActiveTab('list');
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setActiveTab('list');
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Invoice Template Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'list' ? (
            <div className="h-full overflow-y-auto p-6">
              <TemplateList onEdit={handleEdit} onNew={handleNew} />
            </div>
          ) : (
            <div className="h-full">
              <TemplateEditor
                template={selectedTemplate}
                isEditing={isEditing}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateManager;