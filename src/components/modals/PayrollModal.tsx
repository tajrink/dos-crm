import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { X, DollarSign, Calendar } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  base_salary: number;
  currency: string;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  bonuses?: number;
  deductions?: any; // JSONB field
  tax_amount?: number;
  net_salary: number;
  payment_date?: string;
  payment_method?: string;
  payment_by?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  payrollRecord?: PayrollRecord | null;
  mode: 'add' | 'edit' | 'view';
}

const payrollSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  pay_period: z.string().min(1, 'Pay period is required'),
  base_salary: z.number().min(0, 'Base salary must be positive'),
  overtime_hours: z.number().min(0, 'Overtime hours must be positive').default(0),
  overtime_rate: z.number().min(0, 'Overtime rate must be positive').default(0),
  bonuses: z.number().min(0, 'Bonuses must be positive').default(0),
  deductions: z.number().min(0, 'Deductions must be positive').default(0),
  tax_deductions: z.number().min(0, 'Tax deductions must be positive').default(0),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['bank_transfer', 'check', 'cash', 'paypal', 'mfs']),
  payment_by: z.string().min(1, 'Payment by is required'),
  status: z.enum(['pending', 'processing', 'paid', 'failed']).default('pending'),
  notes: z.string().optional(),
});

type PayrollFormData = z.infer<typeof payrollSchema>;

const PayrollModal: React.FC<PayrollModalProps> = ({
  isOpen,
  onClose,
  onSave,
  payrollRecord,
  mode
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper function to get pay period start and end dates
  const getPayPeriodDates = (payPeriod: string): [string, string] => {
    const [year, month] = payPeriod.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    return [
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ];
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      employee_id: '',
      pay_period: '',
      base_salary: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      bonuses: 0,
      deductions: 0,
      tax_deductions: 0,
      payment_date: '',
      payment_method: 'bank_transfer',
      status: 'pending',
      notes: '',
    }
  });

  const watchedValues = watch(['base_salary', 'overtime_hours', 'overtime_rate', 'bonuses', 'deductions', 'tax_deductions', 'employee_id']);
  const [baseSalary, overtimeHours, overtimeRate, bonuses, deductions, taxDeductions, employeeId] = watchedValues;

  // Calculate gross and net pay
  const grossPay = React.useMemo(() => {
    const overtimePay = (overtimeHours || 0) * (overtimeRate || 0);
    return (baseSalary || 0) + overtimePay + (bonuses || 0);
  }, [baseSalary, overtimeHours, overtimeRate, bonuses]);

  const netPay = React.useMemo(() => {
    return Math.max(0, grossPay - (deductions || 0) - (taxDeductions || 0));
  }, [grossPay, deductions, taxDeductions]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employeeId) {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee && mode === 'add') {
        setValue('base_salary', employee.base_salary);
      }
    }
  }, [employeeId, employees, setValue, mode]);

  useEffect(() => {
    if (payrollRecord && mode === 'edit') {
      // Parse deductions from JSONB format
      let generalDeductions = 0;
      let taxDeductions = 0;
      
      if (payrollRecord.deductions && typeof payrollRecord.deductions === 'object') {
        if (Array.isArray(payrollRecord.deductions)) {
          const generalDed = payrollRecord.deductions.find((d: any) => d.type === 'general');
          const taxDed = payrollRecord.deductions.find((d: any) => d.type === 'tax');
          generalDeductions = generalDed?.amount || 0;
          taxDeductions = taxDed?.amount || 0;
        }
      }

      // Convert pay period dates back to YYYY-MM format
      const payPeriod = payrollRecord.pay_period_start 
        ? payrollRecord.pay_period_start.substring(0, 7) 
        : new Date().toISOString().slice(0, 7);

      reset({
        employee_id: payrollRecord.employee_id,
        pay_period: payPeriod,
        base_salary: payrollRecord.base_salary,
        overtime_hours: payrollRecord.overtime_hours || 0,
        overtime_rate: payrollRecord.overtime_rate || 0,
        bonuses: payrollRecord.bonuses || 0,
        deductions: generalDeductions,
        tax_deductions: payrollRecord.tax_amount || taxDeductions,
        payment_date: payrollRecord.payment_date ? payrollRecord.payment_date.split('T')[0] : '',
        payment_method: payrollRecord.payment_method as any,
        payment_by: payrollRecord.payment_by || 'Admin',
        status: payrollRecord.status === 'draft' ? 'pending' : payrollRecord.status as any,
        notes: payrollRecord.notes || '',
      });
    } else if (mode === 'add') {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
      const paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]; // Last day of current month
      
      reset({
        employee_id: '',
        pay_period: currentMonth,
        base_salary: 0,
        overtime_hours: 0,
        overtime_rate: 0,
        bonuses: 0,
        deductions: 0,
        tax_deductions: 0,
        payment_date: paymentDate,
        payment_method: 'bank_transfer',
        payment_by: 'Admin',
        status: 'pending',
        notes: '',
      });
    }
  }, [payrollRecord, mode, reset]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, role, department, base_salary, currency')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const onSubmit = async (data: PayrollFormData) => {
    try {
      setLoading(true);

      // Map form data to database schema
      const [payPeriodStart, payPeriodEnd] = getPayPeriodDates(data.pay_period);
      
      const payrollData = {
        employee_id: data.employee_id,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        base_salary: data.base_salary,
        overtime_hours: data.overtime_hours,
        overtime_rate: data.overtime_rate,
        bonuses: data.bonuses,
        deductions: JSON.stringify([
          { type: 'general', amount: data.deductions },
          { type: 'tax', amount: data.tax_deductions }
        ]),
        tax_amount: data.tax_deductions,
        net_salary: netPay, // Use net_salary instead of net_pay
        payment_date: new Date(data.payment_date).toISOString().split('T')[0],
        payment_method: data.payment_method,
        payment_by: data.payment_by,
        status: data.status === 'pending' ? 'draft' : data.status === 'paid' ? 'paid' : 'processed',
        updated_at: new Date().toISOString(),
      };

      if (mode === 'edit' && payrollRecord) {
        const { error } = await supabase
          .from('payroll_records')
          .update(payrollData)
          .eq('id', payrollRecord.id);

        if (error) throw error;
        toast.success('Payroll record updated successfully');
      } else {
        const { error } = await supabase
          .from('payroll_records')
          .insert([{
            ...payrollData,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        toast.success('Payroll record created successfully');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving payroll record:', error);
      toast.error('Failed to save payroll record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Payroll Record' : mode === 'view' ? 'View Payroll Record' : 'New Payroll Record'}
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
            {/* Employee and Pay Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employee *
                </label>
                <select
                  {...register('employee_id')}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </option>
                  ))}
                </select>
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pay Period *
                </label>
                <input
                  type="month"
                  {...register('pay_period')}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {errors.pay_period && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pay_period.message}</p>
                )}
              </div>
            </div>

            {/* Salary Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Salary *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('base_salary', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
                {errors.base_salary && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.base_salary.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overtime Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('overtime_hours', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.overtime_hours && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.overtime_hours.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overtime Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('overtime_rate', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
                {errors.overtime_rate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.overtime_rate.message}</p>
                )}
              </div>
            </div>

            {/* Bonuses and Deductions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bonuses
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('bonuses', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
                {errors.bonuses && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bonuses.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deductions
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('deductions', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
                {errors.deductions && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deductions.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax Deductions
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('tax_deductions', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
                {errors.tax_deductions && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tax_deductions.message}</p>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  {...register('payment_date')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.payment_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.payment_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  {...register('payment_method')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="paypal">PayPal</option>
                  <option value="mfs">MFS</option>
                </select>
                {errors.payment_method && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.payment_method.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment By *
                </label>
                <select
                  {...register('payment_by')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="TroubleShooter">TroubleShooter</option>
                  <option value="TJ">TJ</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Finance Team">Finance Team</option>
                </select>
                {errors.payment_by && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.payment_by.message}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Payment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Gross Pay:</span>
                  <div className="font-medium text-gray-900 dark:text-white">${grossPay.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Deductions:</span>
                  <div className="font-medium text-gray-900 dark:text-white">${((deductions || 0) + (taxDeductions || 0)).toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Net Pay:</span>
                  <div className="font-medium text-green-600 dark:text-green-400">${netPay.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Overtime Pay:</span>
                  <div className="font-medium text-gray-900 dark:text-white">${((overtimeHours || 0) * (overtimeRate || 0)).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes about this payroll record..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {mode !== 'view' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : mode === 'edit' ? 'Update Record' : 'Create Record'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PayrollModal;