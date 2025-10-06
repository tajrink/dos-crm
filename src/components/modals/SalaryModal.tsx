import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { X, DollarSign, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'development' | 'creative' | 'mobile';
  base_salary: number;
  created_at: string;
}

interface Salary {
  id: string;
  employee_id: string;
  month_year: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  total_due: number;
  paid_amount: number;
  payment_date?: string;
  method?: 'bank_transfer' | 'paypal' | 'wire' | 'cash';
  receipt_url?: string;
  status: 'unpaid' | 'paid' | 'partial';
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  salary?: Salary | null;
  mode: 'add' | 'edit';
}

const salarySchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  month_year: z.string().min(1, 'Month/Year is required'),
  base_salary: z.number().min(0, 'Base salary must be positive'),
  bonus: z.number().min(0, 'Bonus must be positive'),
  deductions: z.number().min(0, 'Deductions must be positive'),
  paid_amount: z.number().min(0, 'Paid amount must be positive'),
  payment_date: z.string().optional(),
  method: z.enum(['bank_transfer', 'paypal', 'wire', 'cash']).optional(),
  receipt_url: z.string().optional(),
  status: z.enum(['unpaid', 'paid', 'partial']),
  notes: z.string().optional(),
});

type SalaryFormData = z.infer<typeof salarySchema>;

const SalaryModal: React.FC<SalaryModalProps> = ({
  isOpen,
  onClose,
  employees,
  salary,
  mode,
}) => {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      employee_id: '',
      month_year: format(new Date(), 'yyyy-MM'),
      base_salary: 0,
      bonus: 0,
      deductions: 0,
      paid_amount: 0,
      payment_date: '',
      method: 'bank_transfer',
      receipt_url: '',
      status: 'unpaid',
      notes: '',
    },
  });

  const watchedValues = watch(['base_salary', 'bonus', 'deductions', 'employee_id']);
  const [baseSalary, bonus, deductions, employeeId] = watchedValues;

  // Calculate total due
  const totalDue = React.useMemo(() => {
    return Math.max(0, (baseSalary || 0) + (bonus || 0) - (deductions || 0));
  }, [baseSalary, bonus, deductions]);

  // Update selected employee when employee_id changes
  React.useEffect(() => {
    if (employeeId) {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        setSelectedEmployee(employee);
        setValue('base_salary', employee.base_salary);
      }
    }
  }, [employeeId, employees, setValue]);

  // Reset form when modal opens/closes or salary changes
  React.useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && salary) {
        reset({
          employee_id: salary.employee_id,
          month_year: salary.month_year,
          base_salary: salary.base_salary,
          bonus: salary.bonus,
          deductions: salary.deductions,
          paid_amount: salary.paid_amount,
          payment_date: salary.payment_date || '',
          method: salary.method || 'bank_transfer',
          receipt_url: salary.receipt_url || '',
          status: salary.status,
          notes: salary.notes || '',
        });
        const employee = employees.find(emp => emp.id === salary.employee_id);
        setSelectedEmployee(employee || null);
      } else {
        reset({
          employee_id: '',
          month_year: format(new Date(), 'yyyy-MM'),
          base_salary: 0,
          bonus: 0,
          deductions: 0,
          paid_amount: 0,
          payment_date: '',
          method: 'bank_transfer',
          receipt_url: '',
          status: 'unpaid',
          notes: '',
        });
        setSelectedEmployee(null);
      }
    }
  }, [isOpen, mode, salary, employees, reset]);

  // Create salary mutation
  const createSalaryMutation = useMutation({
    mutationFn: async (data: SalaryFormData) => {
      const salaryData = {
        ...data,
        total_due: totalDue,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('salaries')
        .insert([salaryData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salary record created successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create salary record');
    },
  });

  // Update salary mutation
  const updateSalaryMutation = useMutation({
    mutationFn: async (data: SalaryFormData) => {
      if (!salary) throw new Error('No salary to update');
      
      const salaryData = {
        ...data,
        total_due: totalDue,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('salaries')
        .update(salaryData)
        .eq('id', salary.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salary record updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update salary record');
    },
  });

  const onSubmit = (data: SalaryFormData) => {
    if (mode === 'edit') {
      updateSalaryMutation.mutate(data);
    } else {
      createSalaryMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Salary Record' : 'Add Salary Record'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee *
              </label>
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
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.employee_id.message}
                </p>
              )}
            </div>

            {/* Month/Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Month/Year *
              </label>
              <input
                type="month"
                {...register('month_year')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.month_year && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.month_year.message}
                </p>
              )}
            </div>

            {/* Base Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Salary *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  step="0.01"
                  {...register('base_salary', { valueAsNumber: true })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              {errors.base_salary && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.base_salary.message}
                </p>
              )}
            </div>

            {/* Bonus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bonus
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  step="0.01"
                  {...register('bonus', { valueAsNumber: true })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              {errors.bonus && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.bonus.message}
                </p>
              )}
            </div>

            {/* Deductions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deductions
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  step="0.01"
                  {...register('deductions', { valueAsNumber: true })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              {errors.deductions && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.deductions.message}
                </p>
              )}
            </div>

            {/* Total Due (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Due (Calculated)
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${totalDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Payment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.status.message}
                  </p>
                )}
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paid Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    step="0.01"
                    {...register('paid_amount', { valueAsNumber: true })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                {errors.paid_amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.paid_amount.message}
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  {...register('payment_date')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.payment_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.payment_date.message}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  {...register('method')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="wire">Wire Transfer</option>
                  <option value="cash">Cash</option>
                </select>
                {errors.method && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.method.message}
                  </p>
                )}
              </div>
            </div>

            {/* Receipt URL */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt URL
              </label>
              <input
                type="url"
                {...register('receipt_url')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://..."
              />
              {errors.receipt_url && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.receipt_url.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes about this salary record..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>

          {/* Employee Info Display */}
          {selectedEmployee && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Employee Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Name:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-300">{selectedEmployee.name}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Role:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-300">{selectedEmployee.role}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Department:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-300 capitalize">{selectedEmployee.department}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Base Salary:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-300">${selectedEmployee.base_salary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                mode === 'edit' ? 'Update Salary' : 'Create Salary'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryModal;