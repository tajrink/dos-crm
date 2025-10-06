import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  department: string;
  annual_budget?: number;
  monthly_budget?: number;
  is_active: boolean;
  created_at: string;
}

interface BudgetModalProps {
  category?: BudgetCategory | null;
  onClose: () => void;
}

const budgetSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  annual_budget: z.number().min(0, 'Annual budget must be positive').optional(),
  monthly_budget: z.number().min(0, 'Monthly budget must be positive').optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const BudgetModal: React.FC<BudgetModalProps> = ({ category, onClose }) => {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      department: category?.department || '',
      annual_budget: category?.annual_budget || 0,
      monthly_budget: category?.monthly_budget || 0,
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const { error } = await supabase
        .from('budget_categories')
        .insert({
          name: data.name,
          description: data.description || null,
          department: data.department,
          annual_budget: data.annual_budget || 0,
          monthly_budget: data.monthly_budget || 0,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success('Budget category created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to create budget category');
      console.error('Create budget error:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      if (!category) throw new Error('No category to update');
      
      const { error } = await supabase
        .from('budget_categories')
        .update({
          name: data.name,
          description: data.description || null,
          department: data.department,
          annual_budget: data.annual_budget || 0,
          monthly_budget: data.monthly_budget || 0,
        })
        .eq('id', category.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success('Budget category updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update budget category');
      console.error('Update budget error:', error);
    }
  });

  const onSubmit = (data: BudgetFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Budget Category' : 'Create Budget Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Name *
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Marketing, Development, Operations"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description of this budget category"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department *
            </label>
            <select
              {...register('department')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Department</option>
              <option value="development">Development</option>
              <option value="creative">Creative</option>
              <option value="mobile">Mobile</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
              <option value="hr">Human Resources</option>
              <option value="finance">Finance</option>
            </select>
            {errors.department && (
              <p className="text-red-600 text-sm mt-1">{errors.department.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Annual Budget
              </label>
              <input
                {...register('annual_budget', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              {errors.annual_budget && (
                <p className="text-red-600 text-sm mt-1">{errors.annual_budget.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Budget
              </label>
              <input
                {...register('monthly_budget', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              {errors.monthly_budget && (
                <p className="text-red-600 text-sm mt-1">{errors.monthly_budget.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isEditing ? 'Update Category' : 'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;