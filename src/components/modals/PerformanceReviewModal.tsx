import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { X, Star } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period_start: string;
  review_period_end: string;
  review_type: string;
  goals_achievements: string;
  strengths: string;
  areas_for_improvement: string;
  overall_rating: number;
  promotion_recommendation: boolean;
  salary_increase_recommendation: number;
  comments: string;
  status: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

interface PerformanceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  performanceReview?: PerformanceReview | null;
  mode: 'add' | 'edit' | 'view';
}

const performanceReviewSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  review_period_start: z.string().min(1, 'Start date is required'),
  review_period_end: z.string().min(1, 'End date is required'),
  review_type: z.enum(['annual', 'quarterly', 'probationary', 'mid_year']),
  goals_achievements: z.string().min(1, 'Goals and achievements are required'),
  strengths: z.string().min(1, 'Strengths are required'),
  areas_for_improvement: z.string().min(1, 'Areas for improvement are required'),
  overall_rating: z.number().min(1).max(5),
  promotion_recommendation: z.boolean().default(false),
  salary_increase_recommendation: z.number().min(0).default(0),
  comments: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'approved']).default('draft'),
});

type PerformanceReviewFormData = z.infer<typeof performanceReviewSchema>;

const PerformanceReviewModal: React.FC<PerformanceReviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  performanceReview,
  mode
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PerformanceReviewFormData>({
    resolver: zodResolver(performanceReviewSchema),
    defaultValues: {
      employee_id: '',
      review_period_start: '',
      review_period_end: '',
      review_type: 'annual',
      goals_achievements: '',
      strengths: '',
      areas_for_improvement: '',
      overall_rating: 3,
      promotion_recommendation: false,
      salary_increase_recommendation: 0,
      comments: '',
      status: 'draft',
    }
  });

  const overallRating = watch('overall_rating');

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (performanceReview && mode === 'edit') {
      // Map database fields to form fields for editing
      reset({
        employee_id: performanceReview.employee_id,
        review_period_start: performanceReview.review_period_start.split('T')[0],
        review_period_end: performanceReview.review_period_end.split('T')[0],
        review_type: 'annual', // Default since review_type doesn't exist in DB
        goals_achievements: Array.isArray(performanceReview.goals) ? performanceReview.goals[0] || '' : '',
        strengths: Array.isArray(performanceReview.achievements) ? performanceReview.achievements[0] || '' : '',
        areas_for_improvement: Array.isArray(performanceReview.areas_for_improvement) ? performanceReview.areas_for_improvement[0] || '' : '',
        overall_rating: performanceReview.overall_rating,
        promotion_recommendation: performanceReview.promotion_recommendation,
        salary_increase_recommendation: performanceReview.salary_recommendation || 0,
        comments: '',
        status: performanceReview.status as any,
      });
    } else if (mode === 'add') {
      reset({
        employee_id: '',
        review_period_start: '',
        review_period_end: '',
        review_type: 'annual',
        goals_achievements: '',
        strengths: '',
        areas_for_improvement: '',
        overall_rating: 3,
        promotion_recommendation: false,
        salary_increase_recommendation: 0,
        comments: '',
        status: 'draft',
      });
    }
  }, [performanceReview, mode, reset]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, role, department')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const onSubmit = async (data: PerformanceReviewFormData) => {
    try {
      setLoading(true);

      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Find or create employee record for current user
      let reviewerEmployeeId = null;
      
      // First, try to find existing employee record by email
      const { data: existingEmployee, error: findError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingEmployee) {
        reviewerEmployeeId = existingEmployee.id;
      } else if (findError?.code === 'PGRST116') {
        // No employee found, create one automatically
        const { data: newEmployee, error: createError } = await supabase
          .from('employees')
          .insert([{
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
            email: user.email,
            role: 'Manager', // Default role for reviewers
            department: 'Management', // Default department
            employment_type: 'full_time',
            joining_date: new Date().toISOString().split('T')[0],
            status: 'active',
            base_salary: 0,
            currency: 'USD'
          }])
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating employee record:', createError);
          toast.error('Failed to create employee record for reviewer');
          return;
        }

        reviewerEmployeeId = newEmployee.id;
        toast.success('Employee record created for reviewer');
      } else {
        console.error('Error finding employee:', findError);
        toast.error('Failed to find or create employee record');
        return;
      }

      // Map form data to database schema
      const reviewData = {
        employee_id: data.employee_id,
        reviewer_id: reviewerEmployeeId, // Use employee ID instead of auth user ID
        review_period_start: new Date(data.review_period_start).toISOString(),
        review_period_end: new Date(data.review_period_end).toISOString(),
        overall_rating: data.overall_rating,
        goals: [data.goals_achievements], // Map to JSONB array
        achievements: [data.strengths], // Map to JSONB array
        areas_for_improvement: [data.areas_for_improvement], // Map to JSONB array
        salary_recommendation: data.salary_increase_recommendation,
        promotion_recommendation: data.promotion_recommendation,
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      if (mode === 'edit' && performanceReview) {
        const { error } = await supabase
          .from('performance_reviews')
          .update(reviewData)
          .eq('id', performanceReview.id);

        if (error) throw error;
        toast.success('Performance review updated successfully');
      } else {
        const { error } = await supabase
          .from('performance_reviews')
          .insert([{
            ...reviewData,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        toast.success('Performance review created successfully');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving performance review:', error);
      toast.error('Failed to save performance review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type="button"
        onClick={() => setValue('overall_rating', index + 1)}
        className={`h-6 w-6 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        } hover:text-yellow-400 transition-colors`}
      >
        <Star className="h-full w-full" />
      </button>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Performance Review' : mode === 'view' ? 'Performance Review Details' : 'New Performance Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee and Review Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employee *
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {performanceReview?.employees?.name} - {performanceReview?.employees?.role}
                  </div>
                ) : (
                  <select
                    {...register('employee_id')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.role}
                      </option>
                    ))}
                  </select>
                )}
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reviewer
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  {user?.user_metadata?.name || user?.email || 'Current User'}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You are automatically set as the reviewer
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review Period Start *
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {performanceReview?.review_period_start ? new Date(performanceReview.review_period_start).toLocaleDateString() : ''}
                  </div>
                ) : (
                  <input
                    type="date"
                    {...register('review_period_start')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                )}
                {errors.review_period_start && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.review_period_start.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review Period End *
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {performanceReview?.review_period_end ? new Date(performanceReview.review_period_end).toLocaleDateString() : ''}
                  </div>
                ) : (
                  <input
                    type="date"
                    {...register('review_period_end')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                )}
                {errors.review_period_end && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.review_period_end.message}</p>
                )}
              </div>
            </div>

            {/* Review Type and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review Type *
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {performanceReview?.review_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                ) : (
                  <select
                    {...register('review_type')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="annual">Annual Review</option>
                    <option value="quarterly">Quarterly Review</option>
                    <option value="probationary">Probationary Review</option>
                    <option value="mid_year">Mid-Year Review</option>
                  </select>
                )}
                {errors.review_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.review_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {performanceReview?.status?.charAt(0).toUpperCase() + performanceReview?.status?.slice(1)}
                  </div>
                ) : (
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                  </select>
                )}
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Goals and Achievements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goals & Achievements *
              </label>
              {mode === 'view' ? (
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[100px] whitespace-pre-wrap">
                  {Array.isArray(performanceReview?.goals) ? performanceReview.goals[0] : performanceReview?.goals_achievements || ''}
                </div>
              ) : (
                <textarea
                  {...register('goals_achievements')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe the employee's goals and achievements during this review period..."
                />
              )}
              {errors.goals_achievements && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.goals_achievements.message}</p>
              )}
            </div>

            {/* Strengths */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strengths *
              </label>
              {mode === 'view' ? (
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[75px] whitespace-pre-wrap">
                  {Array.isArray(performanceReview?.achievements) ? performanceReview.achievements[0] : performanceReview?.strengths || ''}
                </div>
              ) : (
                <textarea
                  {...register('strengths')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="List the employee's key strengths and positive attributes..."
                />
              )}
              {errors.strengths && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.strengths.message}</p>
              )}
            </div>

            {/* Areas for Improvement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Areas for Improvement *
              </label>
              {mode === 'view' ? (
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[75px] whitespace-pre-wrap">
                  {Array.isArray(performanceReview?.areas_for_improvement) ? performanceReview.areas_for_improvement[0] : performanceReview?.areas_for_improvement || ''}
                </div>
              ) : (
                <textarea
                  {...register('areas_for_improvement')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Identify areas where the employee can improve..."
                />
              )}
              {errors.areas_for_improvement && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.areas_for_improvement.message}</p>
              )}
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Overall Rating *
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {mode === 'view' ? (
                    Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-6 w-6 ${
                          index < (performanceReview?.overall_rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))
                  ) : (
                    renderStars(overallRating)
                  )}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {mode === 'view' ? performanceReview?.overall_rating : overallRating}/5
                </span>
              </div>
              {errors.overall_rating && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.overall_rating.message}</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {mode === 'view' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Promotion Recommendation
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {performanceReview?.promotion_recommendation ? 'Yes' : 'No'}
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('promotion_recommendation')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recommend for Promotion
                    </span>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salary Increase Recommendation (%)
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {performanceReview?.salary_recommendation || 0}%
                  </div>
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register('salary_increase_recommendation', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.0"
                  />
                )}
                {errors.salary_increase_recommendation && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.salary_increase_recommendation.message}</p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Comments
              </label>
              {mode === 'view' ? (
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[75px] whitespace-pre-wrap">
                  {performanceReview?.comments || 'No additional comments'}
                </div>
              ) : (
                <textarea
                  {...register('comments')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Any additional comments or notes..."
                />
              )}
            </div>

            {/* Form Actions */}
            {mode !== 'view' && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : mode === 'edit' ? 'Update Review' : 'Create Review'}
                </button>
              </div>
            )}
            {mode === 'view' && (
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReviewModal;