import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { X, Calendar, DollarSign, AlertTriangle, User } from 'lucide-react';

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

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  request?: TeamRequest | null;
  mode: 'add' | 'edit';
}

const requestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  priority: z.enum(['Low', 'Medium', 'High']),
  due_date: z.string().optional(),
  assignee_id: z.string().optional(),
  status: z.enum(['Backlog', 'In Progress', 'Review', 'Completed']).default('Backlog'),
});

type RequestFormData = z.infer<typeof requestSchema>;

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  employees,
  request,
  mode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<Employee | null>(null);
  
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      due_date: '',
      assignee_id: '',
      status: 'Backlog',
    },
  });

  const watchedAssigneeId = watch('assignee_id');

  // Update selected assignee when form values change

  useEffect(() => {
    if (watchedAssigneeId) {
      const assignee = employees.find(emp => emp.id === watchedAssigneeId);
      setSelectedAssignee(assignee || null);
    }
  }, [watchedAssigneeId, employees]);

  // Reset form when modal opens/closes or request changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && request) {
        reset({
          title: request.title,
          description: request.description,
          priority: request.priority,
          due_date: request.due_date ? request.due_date.split('T')[0] : '',
          assignee_id: request.assignee_id || '',
          status: request.status,
        });
      } else {
        reset({
          title: '',
          description: '',
          priority: 'Medium',
          due_date: '',
          assignee_id: '',
          status: 'Backlog',
        });
      }
    }
  }, [isOpen, mode, request, reset]);

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const requestData = {
        ...data,
        due_date: data.due_date || null,
        assignee_id: data.assignee_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('team_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-requests'] });
      toast.success('Request created successfully!');
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create request');
    },
  });

  // Update request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      if (!request) throw new Error('No request to update');

      const requestData = {
        ...data,
        due_date: data.due_date || null,
        assignee_id: data.assignee_id || null,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('team_requests')
        .update(requestData)
        .eq('id', request.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-requests'] });
      toast.success('Request updated successfully!');
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update request');
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsLoading(true);
    try {
      if (mode === 'edit') {
        await updateRequestMutation.mutateAsync(data);
      } else {
        await createRequestMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Request' : 'Create New Request'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter request title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe the request in detail"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority *
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.priority.message}</p>
            )}
          </div>

          {/* Due Date and Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.due_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignee
              </label>
              <select
                {...register('assignee_id')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select assignee (optional)</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.role})
                  </option>
                ))}
              </select>
              {errors.assignee_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assignee_id.message}</p>
              )}
              {selectedAssignee && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 mr-1" />
                    {selectedAssignee.name} - {selectedAssignee.role} ({selectedAssignee.department})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status (only for edit mode) */}
          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Backlog">Backlog</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{mode === 'edit' ? 'Update Request' : 'Create Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestModal;