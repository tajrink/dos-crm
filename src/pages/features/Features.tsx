import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  DollarSign,
  Clock,
  Tag,
  FileText,
  Grid,
  List,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import FeatureModal from '../../components/modals/FeatureModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  time_estimate: number; // in hours
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuoteItem {
  feature: Feature;
  quantity: number;
  customPrice?: number;
}

type ViewMode = 'grid' | 'list';

const Features = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedComplexity, setSelectedComplexity] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', company: '' });
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    feature: null as Feature | null,
  });

  // Fetch features
  const { data: features = [], isLoading, error } = useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('features_catalog')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Feature[];
    },
  });

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const { error } = await supabase
        .from('features_catalog')
        .delete()
        .eq('id', featureId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete feature');
    },
  });

  // Filter features
  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           feature.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           feature.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
      const matchesComplexity = selectedComplexity === 'all' || feature.complexity === selectedComplexity;
      
      return matchesSearch && matchesCategory && matchesComplexity && feature.is_active;
    });
  }, [features, searchTerm, selectedCategory, selectedComplexity]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(features.map(f => f.category))];
    return cats.sort();
  }, [features]);

  const handleDeleteFeature = (feature: Feature) => {
    setConfirmationModal({
      isOpen: true,
      feature: feature,
    });
  };

  const handleConfirmDelete = () => {
    if (confirmationModal.feature) {
      deleteFeatureMutation.mutate(confirmationModal.feature.id);
      setConfirmationModal({ isOpen: false, feature: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, feature: null });
  };

  const addToQuote = (feature: Feature) => {
    const existingItem = quoteItems.find(item => item.feature.id === feature.id);
    if (existingItem) {
      setQuoteItems(items => 
        items.map(item => 
          item.feature.id === feature.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setQuoteItems(items => [...items, { feature, quantity: 1 }]);
    }
    toast.success(`${feature.name} added to quote!`);
  };

  const removeFromQuote = (featureId: string) => {
    setQuoteItems(items => items.filter(item => item.feature.id !== featureId));
  };

  const updateQuoteItemQuantity = (featureId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromQuote(featureId);
      return;
    }
    setQuoteItems(items => 
      items.map(item => 
        item.feature.id === featureId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updateQuoteItemPrice = (featureId: string, customPrice: number) => {
    setQuoteItems(items => 
      items.map(item => 
        item.feature.id === featureId 
          ? { ...item, customPrice }
          : item
      )
    );
  };

  const calculateQuoteTotal = () => {
    return quoteItems.reduce((total, item) => {
      const price = item.customPrice || item.feature.base_price;
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateTotalHours = () => {
    return quoteItems.reduce((total, item) => {
      return total + (item.feature.time_estimate * item.quantity);
    }, 0);
  };

  const generatePDFQuote = () => {
    if (quoteItems.length === 0) {
      toast.error('Please add items to the quote first');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text('PROJECT QUOTE', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, margin, yPosition);
    
    yPosition += 10;
    doc.text(`Quote #: Q-${Date.now()}`, margin, yPosition);
    
    // Client Info
    if (clientInfo.name || clientInfo.email || clientInfo.company) {
      yPosition += 20;
      doc.setFontSize(14);
      doc.text('CLIENT INFORMATION', margin, yPosition);
      doc.setFontSize(12);
      yPosition += 10;
      
      if (clientInfo.name) {
        doc.text(`Name: ${clientInfo.name}`, margin, yPosition);
        yPosition += 8;
      }
      if (clientInfo.email) {
        doc.text(`Email: ${clientInfo.email}`, margin, yPosition);
        yPosition += 8;
      }
      if (clientInfo.company) {
        doc.text(`Company: ${clientInfo.company}`, margin, yPosition);
        yPosition += 8;
      }
    }

    // Quote Items
    yPosition += 20;
    doc.setFontSize(14);
    doc.text('QUOTE ITEMS', margin, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(10);
    doc.text('Feature', margin, yPosition);
    doc.text('Qty', margin + 100, yPosition);
    doc.text('Hours', margin + 120, yPosition);
    doc.text('Price', margin + 145, yPosition);
    doc.text('Total', margin + 170, yPosition);
    
    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Quote items
    quoteItems.forEach((item) => {
      const price = item.customPrice || item.feature.base_price;
      const total = price * item.quantity;
      const totalHours = item.feature.time_estimate * item.quantity;
      
      doc.text(item.feature.name.substring(0, 30), margin, yPosition);
      doc.text(item.quantity.toString(), margin + 100, yPosition);
      doc.text(`${totalHours}h`, margin + 120, yPosition);
      doc.text(`$${price.toLocaleString()}`, margin + 145, yPosition);
      doc.text(`$${total.toLocaleString()}`, margin + 170, yPosition);
      
      yPosition += 8;
      
      // Add description if space allows
      if (item.feature.description && yPosition < 250) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const description = item.feature.description.substring(0, 80) + (item.feature.description.length > 80 ? '...' : '');
        doc.text(description, margin + 5, yPosition);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        yPosition += 6;
      }
      
      yPosition += 2;
    });

    // Totals
    yPosition += 10;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.text(`Total Hours: ${calculateTotalHours()}`, margin + 120, yPosition);
    yPosition += 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: $${calculateQuoteTotal().toLocaleString()}`, margin + 120, yPosition);

    // Footer
    yPosition += 30;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This quote is valid for 30 days from the date of generation.', margin, yPosition);
    yPosition += 8;
    doc.text('Please contact us for any questions or modifications.', margin, yPosition);

    // Save the PDF
    const fileName = `quote-${clientInfo.name || 'client'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    
    toast.success('Quote PDF generated successfully!');
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'complex': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
        <p className="text-red-600 dark:text-red-400">Error loading features: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Features Catalog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your service catalog and generate project quotes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {quoteItems.length > 0 && (
            <button
              onClick={() => setShowQuoteModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Quote ({quoteItems.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Feature</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Complexity</option>
              <option value="simple">Simple</option>
              <option value="medium">Medium</option>
              <option value="complex">Complex</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Display */}
      {filteredFeatures.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {features.length === 0 ? 'No features found. Add features to your catalog for project quoting.' : 'No features match your current filters.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredFeatures.map((feature) => (
            <div
              key={feature.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'p-6' : 'p-6'
              }`}
            >
              {viewMode === 'grid' ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {feature.category}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingFeature(feature);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeature(feature)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplexityColor(feature.complexity)}`}>
                      {feature.complexity}
                    </span>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{feature.time_estimate}h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        ${feature.base_price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => addToQuote(feature)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add to Quote</span>
                    </button>
                  </div>
                  
                  {feature.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {feature.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {feature.tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{feature.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {feature.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {feature.category}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplexityColor(feature.complexity)}`}>
                        {feature.complexity}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{feature.time_estimate}h</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          ${feature.base_price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => addToQuote(feature)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add to Quote</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingFeature(feature);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeature(feature)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Quote</h2>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FileText className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Client Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Client Email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={clientInfo.company}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, company: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Quote Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quote Items</h3>
                <div className="space-y-4">
                  {quoteItems.map((item) => (
                    <div key={item.feature.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.feature.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.feature.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplexityColor(item.feature.complexity)}`}>
                              {item.feature.complexity}
                            </span>
                            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>{item.feature.time_estimate * item.quantity}h total</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-500 dark:text-gray-400">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuoteItemQuantity(item.feature.id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-500 dark:text-gray-400">Price:</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.customPrice || item.feature.base_price}
                              onChange={(e) => updateQuoteItemPrice(item.feature.id, parseFloat(e.target.value) || item.feature.base_price)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${((item.customPrice || item.feature.base_price) * item.quantity).toLocaleString()}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeFromQuote(item.feature.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quote Summary */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between text-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Clock className="h-5 w-5" />
                      <span>Total Hours: {calculateTotalHours()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Package className="h-5 w-5" />
                      <span>Total Items: {quoteItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      Total: ${calculateQuoteTotal().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                <button
                  onClick={generatePDFQuote}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Generate PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      <FeatureModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
      />
      
      <FeatureModal
         isOpen={showEditModal}
         onClose={() => setShowEditModal(false)}
         feature={editingFeature}
         mode="edit"
       />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Feature"
        message={`Are you sure you want to delete "${confirmationModal.feature?.name}"? This action cannot be undone.`}
        confirmText="Delete Feature"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteFeatureMutation.isPending}
      />
    </div>
  );
};

export default Features;