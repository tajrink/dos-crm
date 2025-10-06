import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  User,
  Tag,
  MoreVertical,
  X
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import RequestModal from '../../components/modals/RequestModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'development' | 'creative' | 'mobile';
  created_at: string;
}

interface TeamRequest {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string;
  assignee_id?: string;
  status: 'Backlog' | 'In Progress' | 'Review' | 'Completed';
  created_at: string;
  updated_at: string;
  assignee?: Employee;
}

interface RequestStats {
  total: number;
  backlog: number;
  inProgress: number;
  review: number;
  completed: number;
  overdue: number;
}

const Requests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    requestId: null as string | null,
  });

  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Fetch team requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['team-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_requests')
        .select(`
          *,
          assignee:assignee_id(id, name, role, department)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TeamRequest[];
    },
  });

  // Calculate stats
  const stats: RequestStats = React.useMemo(() => {
    const total = requests.length;
    const backlog = requests.filter(r => r.status === 'Backlog').length;
    const inProgress = requests.filter(r => r.status === 'In Progress').length;
    const review = requests.filter(r => r.status === 'Review').length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    const overdue = requests.filter(r => 
      r.due_date && 
      isAfter(new Date(), new Date(r.due_date)) && 
      r.status !== 'Completed'
    ).length;

    return {
      total,
      backlog,
      inProgress,
      review,
      completed,
      overdue,
    };
  }, [requests]);

  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-requests'] });
      toast.success('Request deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete request: ' + (error as Error).message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('team_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-requests'] });
      toast.success('Request status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + (error as Error).message);
    },
  });

  // Filter requests
  const filteredRequests = React.useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.assignee?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    });
  }, [requests, searchTerm, priorityFilter]);

  // Group requests by status
  const requestsByStatus = React.useMemo(() => {
    return {
      backlog: filteredRequests.filter(r => r.status === 'Backlog'),
      inProgress: filteredRequests.filter(r => r.status === 'In Progress'),
      review: filteredRequests.filter(r => r.status === 'Review'),
      completed: filteredRequests.filter(r => r.status === 'Completed'),
    };
  }, [filteredRequests]);

  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      // Map droppableId to correct database status values
      const statusMap: { [key: string]: string } = {
        'backlog': 'Backlog',
        'inProgress': 'In Progress',
        'review': 'Review',
        'completed': 'Completed'
      };
      
      const newStatus = statusMap[destination.droppableId];
      if (newStatus) {
        updateStatusMutation.mutate({ id: draggableId, status: newStatus });
      }
    }
  };

  // Handle actions
  const handleEdit = (request: TeamRequest) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  const handlePreview = (request: TeamRequest) => {
    setSelectedRequest(request);
    setShowPreview(true);
  };

  const handleDelete = (id: string) => {
    setConfirmationModal({
      isOpen: true,
      requestId: id,
    });
  };

  const handleConfirmDelete = () => {
    if (confirmationModal.requestId) {
      deleteRequestMutation.mutate(confirmationModal.requestId);
      setConfirmationModal({ isOpen: false, requestId: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, requestId: null });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Backlog': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };



  const isOverdue = (dueDate: string) => {
    return isAfter(new Date(), new Date(dueDate));
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
        <p className="text-red-600">Error loading requests: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Requests</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Request</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Backlog</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.backlog}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Eye className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Review</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.review}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Backlog Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Backlog ({requestsByStatus.backlog.length})
              </h3>
            </div>
            <Droppable droppableId="backlog">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-4 space-y-3 min-h-[200px]"
                >
                  {requestsByStatus.backlog.map((request, index) => (
                    <Draggable key={request.id} draggableId={request.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{request.title}</h4>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handlePreview(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {request.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                              {request.assignee && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <User className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{request.assignee.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {request.due_date && (
                            <div className={`mt-2 text-xs flex items-center ${
                              isOverdue(request.due_date) ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {format(new Date(request.due_date), 'MMM dd, yyyy')}
                              {isOverdue(request.due_date) && (
                                <AlertTriangle className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          )}
                          

                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Review Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                In Review ({requestsByStatus.review.length})
              </h3>
            </div>
            <Droppable droppableId="review">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-4 space-y-3 min-h-[200px]"
                >
                  {requestsByStatus.review.map((request, index) => (
                    <Draggable key={request.id} draggableId={request.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{request.title}</h4>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handlePreview(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {request.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                              {request.assignee && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <User className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{request.assignee.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {request.due_date && (
                            <div className={`mt-2 text-xs flex items-center ${
                              isOverdue(request.due_date) ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {format(new Date(request.due_date), 'MMM dd, yyyy')}
                              {isOverdue(request.due_date) && (
                                <AlertTriangle className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          )}
                          

                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* In Progress Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                In Progress ({requestsByStatus.inProgress.length})
              </h3>
            </div>
            <Droppable droppableId="inProgress">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-4 space-y-3 min-h-[200px]"
                >
                  {requestsByStatus.inProgress.map((request, index) => (
                    <Draggable key={request.id} draggableId={request.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{request.title}</h4>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handlePreview(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {request.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                              {request.assignee && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <User className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{request.assignee.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {request.due_date && (
                            <div className={`mt-2 text-xs flex items-center ${
                              isOverdue(request.due_date) ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {format(new Date(request.due_date), 'MMM dd, yyyy')}
                              {isOverdue(request.due_date) && (
                                <AlertTriangle className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          )}
                          

                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Completed Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Completed ({requestsByStatus.completed.length})
              </h3>
            </div>
            <Droppable droppableId="completed">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-4 space-y-3 min-h-[200px]"
                >
                  {requestsByStatus.completed.map((request, index) => (
                    <Draggable key={request.id} draggableId={request.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer opacity-75"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{request.title}</h4>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <button
                                onClick={() => handlePreview(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(request)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {request.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                              {request.assignee && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <User className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{request.assignee.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          

                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {/* Modals */}
      <RequestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        employees={employees}
        mode="add"
      />

      <RequestModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        employees={employees}
        request={selectedRequest}
        mode="edit"
      />

      {/* Preview Modal */}
      {showPreview && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Request Details</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{selectedRequest.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedRequest.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Priority</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                
                {selectedRequest.due_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</label>
                    <p className={`mt-1 ${
                      isOverdue(selectedRequest.due_date) ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {format(new Date(selectedRequest.due_date), 'MMM dd, yyyy')}
                      {isOverdue(selectedRequest.due_date) && ' (Overdue)'}
                    </p>
                  </div>
                )}
                
                {selectedRequest.assignee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{selectedRequest.assignee.name} ({selectedRequest.assignee.role})</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <label className="block font-medium">Created</label>
                  <p>{format(new Date(selectedRequest.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <label className="block font-medium">Last Updated</label>
                  <p>{format(new Date(selectedRequest.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Request"
        message="Are you sure you want to delete this request? This action cannot be undone."
        confirmText="Delete Request"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteRequestMutation.isPending}
      />
    </div>
  );
};

export default Requests;