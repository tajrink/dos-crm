import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  FolderOpen,
  FileText,
  User,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ClientModal from '../../components/modals/ClientModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date?: string;
  budget: number;
  client_id: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  due_date: string;
  created_at: string;
  client_id: string;
}

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch client projects
  const { data: clientProjects = [] } = useQuery({
    queryKey: ['client-projects', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!selectedClient?.id,
  });

  // Fetch client invoices
  const { data: clientInvoices = [] } = useQuery({
    queryKey: ['client-invoices', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!selectedClient?.id,
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
      setSelectedClient(null);
    },
    onError: (error) => {
      toast.error('Failed to delete client');
      console.error('Delete error:', error);
    },
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({
    isOpen: false,
    client: null,
  });

  const handleDeleteClient = (client: Client) => {
    setConfirmationModal({
      isOpen: true,
      client,
    });
  };

  const handleConfirmDelete = () => {
    if (confirmationModal.client) {
      deleteClientMutation.mutate(confirmationModal.client.id);
      setConfirmationModal({ isOpen: false, client: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, client: null });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error loading clients. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="p-6 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No clients found matching your search.' : 'No clients found. Add your first client to get started.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedClient?.id === client.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {client.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {client.email}
                          </p>
                          {client.company && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {client.company}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingClient(client);
                               setShowEditModal(true);
                             }}
                             className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                           >
                             <Edit className="h-4 w-4" />
                           </button>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteClient(client);
                             }}
                             className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Details */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Client Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{selectedClient.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedClient.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{selectedClient.phone}</span>
                    </div>
                  )}
                  {selectedClient.company && (
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{selectedClient.company}</span>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{selectedClient.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'projects', label: 'Projects', icon: FolderOpen },
                    { id: 'invoices', label: 'Invoices', icon: FileText },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Projects</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{clientProjects.length}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Invoices</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600 mt-2">{clientInvoices.length}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-600 mt-2">
                          ${clientInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Client Information</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {format(new Date(selectedClient.created_at), 'MMM dd, yyyy')}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {format(new Date(selectedClient.updated_at), 'MMM dd, yyyy')}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    {clientProjects.length === 0 ? (
                      <div className="text-center py-8">
                        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No projects found for this client.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {clientProjects.map((project) => (
                          <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{project.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Started: {format(new Date(project.start_date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                                  {project.status}
                                </span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                  ${project.budget.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'invoices' && (
                  <div className="space-y-4">
                    {clientInvoices.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No invoices found for this client.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {clientInvoices.map((invoice) => (
                          <div key={invoice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                  Invoice #{invoice.invoice_number}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                  {invoice.status}
                                </span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                  ${invoice.total_amount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Client</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a client from the list to view their details, projects, and invoices.
              </p>
            </div>
          )}
        </div>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Client Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h2>
                      <p className="text-gray-500 dark:text-gray-400">{selectedClient.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedClient.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.company && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{selectedClient.company}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{selectedClient.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'overview', label: 'Overview', icon: User },
                      { id: 'projects', label: 'Projects', icon: FolderOpen },
                      { id: 'invoices', label: 'Invoices', icon: FileText },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Projects</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600 mt-2">{clientProjects.length}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Invoices</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600 mt-2">{clientInvoices.length}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 mt-2">
                            ${clientInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Client Information</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                              <dd className="text-sm text-gray-900 dark:text-white">
                                {format(new Date(selectedClient.created_at), 'MMM dd, yyyy')}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                              <dd className="text-sm text-gray-900 dark:text-white">
                                {format(new Date(selectedClient.updated_at), 'MMM dd, yyyy')}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'projects' && (
                    <div className="space-y-4">
                      {clientProjects.length === 0 ? (
                        <div className="text-center py-8">
                          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No projects found for this client.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {clientProjects.map((project) => (
                            <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">{project.name}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Started: {format(new Date(project.start_date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                                    {project.status}
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                    ${project.budget.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'invoices' && (
                    <div className="space-y-4">
                      {clientInvoices.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No invoices found for this client.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {clientInvoices.map((invoice) => (
                            <div key={invoice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Invoice #{invoice.invoice_number}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                    {invoice.status}
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                    ${invoice.total_amount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Client</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a client from the list to view their details, projects, and invoices.
                </p>
              </div>
            )}
          </div>
      </div>

      {/* Add Client Modal */}
      <ClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
      />

      {/* Edit Client Modal */}
      <ClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingClient(null);
        }}
        client={editingClient}
        mode="edit"
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${confirmationModal.client?.name}"? This action cannot be undone and will also delete all associated projects and invoices.`}
        confirmText="Delete Client"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteClientMutation.isPending}
      />
    </>
  );
};

export default Clients;