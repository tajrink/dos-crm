import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { X, Plus, Minus } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  time_estimate: number;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: Feature | null;
  mode: 'add' | 'edit';
}

const featureSchema = z.object({
  name: z.string().min(1, 'Feature name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  category: z.enum(['Development', 'Design', 'Mobile', 'E-comm', 'Other', 'Marketplace', 'GVI', 'Creative']),
  base_price: z.number().min(0, 'Price must be positive'),
  time_estimate: z.number().min(0.5, 'Time estimate must be at least 0.5 hours'),
  complexity: z.enum(['simple', 'medium', 'complex']),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

type FeatureFormData = z.infer<typeof featureSchema>;

const FeatureModal: React.FC<FeatureModalProps> = ({ isOpen, onClose, feature, mode }) => {
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>(feature?.tags || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: feature?.name || '',
      description: feature?.description || '',
      category: feature?.category || 'Development',
      base_price: feature?.base_price || 0,
      time_estimate: feature?.time_estimate || 1,
      complexity: feature?.complexity || 'simple',
      tags: feature?.tags || [],
      is_active: feature?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (feature && mode === 'edit') {
      reset({
        name: feature.name,
        description: feature.description,
        category: feature.category,
        base_price: feature.base_price,
        time_estimate: feature.time_estimate,
        complexity: feature.complexity,
        tags: feature.tags,
        is_active: feature.is_active,
      });
      setTags(feature.tags);
    } else if (mode === 'add') {
      reset({
        name: '',
        description: '',
        category: '',
        base_price: 0,
        time_estimate: 1,
        complexity: 'simple',
        tags: [],
        is_active: true,
      });
      setTags([]);
    }
  }, [feature, mode, reset]);

  React.useEffect(() => {
    setValue('tags', tags);
  }, [tags, setValue]);

  const createFeatureMutation = useMutation({
    mutationFn: async (data: FeatureFormData) => {
      const { error } = await supabase
        .from('features_catalog')
        .insert([{
          ...data,
          tags,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature created successfully!');
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create feature');
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async (data: FeatureFormData) => {
      if (!feature?.id) throw new Error('Feature ID is required');
      
      const { error } = await supabase
        .from('features_catalog')
        .update({
          ...data,
          tags,
        })
        .eq('id', feature.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature updated successfully!');
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update feature');
    },
  });

  const onSubmit = (data: FeatureFormData) => {
    if (mode === 'add') {
      createFeatureMutation.mutate(data);
    } else {
      updateFeatureMutation.mutate(data);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Add New Feature' : 'Edit Feature'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Feature Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feature Name *
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter feature name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
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
              placeholder="Describe the feature in detail"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Category and Complexity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a category</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Mobile">Mobile</option>
                <option value="E-comm">E-comm</option>
                <option value="Other">Other</option>
                <option value="Marketplace">Marketplace</option>
                <option value="GVI">GVI</option>
                <option value="Creative">Creative</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Complexity *
              </label>
              <select
                {...register('complexity')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
              {errors.complexity && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.complexity.message}</p>
              )}
            </div>
          </div>

          {/* Price and Time Estimate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('base_price', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
              {errors.base_price && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.base_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Estimate (hours) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                {...register('time_estimate', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="1.0"
              />
              {errors.time_estimate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.time_estimate.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Active (visible in catalog)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Feature' : 'Update Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeatureModal;