import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Calendar as CalendarIcon,
  Kanban,
  List,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import ProjectModal from '../../components/modals/ProjectModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { useProjectUpdates } from '../../hooks/useRealTimeUpdates';
import { useApiRetry } from '../../hooks/useRetry';
import { ErrorHandler } from '../../utils/errorHandler';
import { PageLoader, SkeletonCard } from '../../components/LoadingSpinner';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'Backlog' | 'Ready to Quote' | 'Quoted' | 'Scheduled' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  end_date: string;
  budget: number;
  client_id: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

type ViewMode = 'kanban' | 'calendar' | 'list';

const statusColumns = [
  { id: 'Backlog', title: 'Backlog', color: 'bg-gray-100 dark:bg-gray-700' },
  { id: 'Ready to Quote', title: 'Ready to Quote', color: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'Quoted', title: 'Quoted', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { id: 'Scheduled', title: 'Scheduled', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'Completed', title: 'Completed', color: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'On Hold', title: 'On Hold', color: 'bg-red-100 dark:bg-red-900/30' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'planning':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'review':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'on_hold':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 dark:text-red-400';
    case 'high':
      return 'text-orange-600 dark:text-orange-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'low':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const Projects = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const queryClient = useQueryClient();
  const { executeWithRetry, isRetrying } = useApiRetry();

  // Enable real-time updates for projects
  useProjectUpdates();

  // Fetch projects with enhanced error handling
  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    }),
    retry: false,
  });

  // Handle error separately if needed
  if (error) {
    ErrorHandler.handle(error, 'Projects - Fetch projects');
  }

  // Fetch milestones for selected project
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject?.id) return [];
      
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!selectedProject?.id,
  });

  // Update project status mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const { error } = await supabase
        .from('projects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error('Failed to update project status');
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
      setSelectedProject(null);
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    },
  });

  // Handle manual refresh
  const handleManualRefresh = async () => {
    try {
      await refetch();
      toast.success('Projects refreshed successfully');
    } catch (error) {
      ErrorHandler.handle(error, 'Projects - Manual refresh');
    }
  };

  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      updateProjectMutation.mutate({
        projectId: draggableId,
        status: destination.droppableId,
      });
    }
  };

  // Filter projects
  const filteredProjects = (projects as Project[] || []).filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group projects by status for kanban view
  const projectsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = filteredProjects.filter(project => project.status === column.id);
    return acc;
  }, {} as Record<string, Project[]>);

  // Prepare calendar events
  const calendarEvents = filteredProjects.map(project => ({
    id: project.id,
    title: project.name,
    start: new Date(project.start_date),
    end: new Date(project.end_date),
    resource: project,
  }));

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    project: Project | null;
  }>({
    isOpen: false,
    project: null,
  });

  const handleDeleteProject = (project: Project) => {
    setConfirmationModal({
      isOpen: true,
      project,
    });
  };

  const handleConfirmDelete = () => {
    if (confirmationModal.project) {
      deleteProjectMutation.mutate(confirmationModal.project.id);
      setConfirmationModal({ isOpen: false, project: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, project: null });
  };

  if (isLoading || isRetrying) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          {isRetrying && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm font-medium">Updating...</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load projects
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {ErrorHandler.getErrorMessage(error)}
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleManualRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          {isRetrying && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm font-medium">Updating...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRetrying || isLoading}
            className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh projects"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              disabled={isLoading || isRetrying}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              disabled={isLoading || isRetrying}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              disabled={isLoading || isRetrying}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isLoading || isRetrying}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {statusColumns.map((column) => (
              <div key={column.id} className="space-y-4">
                <div className={`${column.color} rounded-lg p-4`}>
                  <h3 className="font-medium text-gray-900 dark:text-white">{column.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {projectsByStatus[column.id]?.length || 0} projects
                  </p>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {projectsByStatus[column.id]?.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                              }`}
                              onClick={() => setSelectedProject(project)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {project.name}
                                  </h4>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingProject(project);
                                        setShowEditModal(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(project);
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                  <User className="h-3 w-3" />
                                  <span>{project.client?.name}</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(project.priority)}`}>
                                    {project.priority}
                                  </span>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                    <DollarSign className="h-3 w-3" />
                                    <span>${project.budget.toLocaleString()}</span>
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Due: {format(new Date(project.end_date), 'MMM dd, yyyy')}
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
            ))}
          </div>
        </DragDropContext>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={(event: any) => setSelectedProject(event.resource)}
              views={['month', 'week', 'day']}
              defaultView="month"
              className="dark:text-white"
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: '#3b82f6',
                  borderColor: '#2563eb',
                  color: 'white',
                },
              })}
            />
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No projects found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {project.client?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${project.budget.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(project.end_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProject(project);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProject.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{selectedProject.client?.name}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600 mt-2 capitalize">
                    {selectedProject.status.replace('_', ' ')}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Budget</span>
                  </div>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    ${selectedProject.budget.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Start Date</span>
                  </div>
                  <p className="text-lg font-bold text-purple-600 mt-2">
                    {format(new Date(selectedProject.start_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Due Date</span>
                  </div>
                  <p className="text-lg font-bold text-orange-600 mt-2">
                    {format(new Date(selectedProject.end_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              {/* Description */}
              {selectedProject.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
                </div>
              )}
              
              {/* Milestones */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Milestones</h3>
                {milestones.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No milestones found for this project.</p>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{milestone.title}</h4>
                            {milestone.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{milestone.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(milestone.status)}`}>
                              {milestone.status.replace('_', ' ')}
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
         </div>
       )}

      {/* Project Add/Edit Modals */}
      <ProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
      />
      
      <ProjectModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProject(null);
        }}
        project={editingProject}
        mode="edit"
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmationModal.project?.name}"? This action cannot be undone and will also delete all associated invoices and project data.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteProjectMutation.isPending}
      />
     </div>
   );
 };
 
 export default Projects;