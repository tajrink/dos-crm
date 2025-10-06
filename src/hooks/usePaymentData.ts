import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface PaymentRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  amount: number;
  currency: 'USD' | 'BDT';
  payment_date: string;
  status: 'pending' | 'approved' | 'paid' | 'failed' | 'cancelled';
  payment_method: 'bank_transfer' | 'cash' | 'check' | 'digital_wallet';
  created_at: string;
  updated_at: string;
}

export interface PaymentSchedule {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  amount: number;
  currency: 'USD' | 'BDT';
  scheduled_date: string;
  status: 'scheduled' | 'pending_approval' | 'approved' | 'cancelled';
  created_at: string;
}

export interface PaymentApproval {
  id: string;
  payment_id: string;
  employee_id: string;
  employee_name: string;
  amount: number;
  currency: 'USD' | 'BDT';
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  created_at: string;
}

export interface PaymentStats {
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  totalAmountUSD: number;
  totalAmountBDT: number;
  successRate: number;
}

interface UsePaymentDataOptions {
  timeframe?: 'current_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year';
  currency?: 'USD' | 'BDT' | 'all';
  department?: string;
  status?: string;
  employeeId?: string;
}

export const usePaymentData = (options: UsePaymentDataOptions = {}) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentSchedule[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PaymentApproval[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalAmountUSD: 0,
    totalAmountBDT: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = (timeframe: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'current_month':
        startDate.setDate(1);
        break;
      case 'last_month':
        startDate.setMonth(now.getMonth() - 1, 1);
        break;
      case 'last_3_months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'last_6_months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'last_year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  };

  const fetchPaymentHistory = async () => {
    try {
      let query = supabase
        .from('payment_history')
        .select(`
          *,
          employees!payment_history_employee_id_fkey(name, email, department)
        `)
        .order('payment_date', { ascending: false });

      if (options.timeframe) {
        const { start, end } = getDateRange(options.timeframe);
        query = query.gte('payment_date', start).lte('payment_date', end);
      }

      if (options.currency && options.currency !== 'all') {
        query = query.eq('currency', options.currency);
      }

      if (options.department) {
        query = query.eq('department', options.department);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.employeeId) {
        query = query.eq('employee_id', options.employeeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Payment history query error:', error);
        throw error;
      }
      
      console.log('Payment history data:', data);
      
      // Transform data to match interface
      const transformedData = (data || []).map(item => ({
        ...item,
        employee_name: item.employee_name || item.employees?.name || 'Unknown',
        department: item.department || item.employees?.department || 'Unknown'
      }));
      
      setPaymentHistory(transformedData);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history');
      toast.error('Failed to fetch payment history');
    }
  };

  const fetchUpcomingPayments = async () => {
    try {
      let query = supabase
        .from('payment_schedules')
        .select(`
          *,
          employees!payment_schedules_employee_id_fkey(name, email, department)
        `)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (options.currency && options.currency !== 'all') {
        query = query.eq('currency', options.currency);
      }

      if (options.department) {
        query = query.eq('department', options.department);
      }

      if (options.employeeId) {
        query = query.eq('employee_id', options.employeeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Payment schedules query error:', error);
        throw error;
      }
      
      console.log('Payment schedules data:', data);
      
      // Transform data to match interface
      const transformedData = (data || []).map(item => ({
        ...item,
        employee_name: item.employee_name || item.employees?.name || 'Unknown',
        department: item.department || item.employees?.department || 'Unknown'
      }));
      
      setUpcomingPayments(transformedData);
    } catch (err) {
      console.error('Error fetching upcoming payments:', err);
      setError('Failed to fetch upcoming payments');
      toast.error('Failed to fetch upcoming payments');
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      let query = supabase
        .from('payment_approvals')
        .select(`
          *,
          employees!payment_approvals_employee_id_fkey(name, email, department)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (options.currency && options.currency !== 'all') {
        query = query.eq('currency', options.currency);
      }

      if (options.employeeId) {
        query = query.eq('employee_id', options.employeeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Payment approvals query error:', error);
        throw error;
      }
      
      console.log('Payment approvals data:', data);
      
      // Transform data to match interface
      const transformedData = (data || []).map(item => ({
        ...item,
        employee_name: item.employee_name || item.employees?.name || 'Unknown'
      }));
      
      setPendingApprovals(transformedData);
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setError('Failed to fetch pending approvals');
      toast.error('Failed to fetch pending approvals');
    }
  };

  const calculateStats = (payments: PaymentRecord[]) => {
    const totalPayments = payments.length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const completedPayments = payments.filter(p => p.status === 'paid').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;

    const totalAmountUSD = payments
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalAmountBDT = payments
      .filter(p => p.currency === 'BDT')
      .reduce((sum, p) => sum + p.amount, 0);

    const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    setStats({
      totalPayments,
      pendingPayments,
      completedPayments,
      failedPayments,
      totalAmountUSD,
      totalAmountBDT,
      successRate,
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Refreshing payment data with options:', options);
      await Promise.all([
        fetchPaymentHistory(),
        fetchUpcomingPayments(),
        fetchPendingApprovals(),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Add CRUD operations for dynamic functionality
  const createPayment = async (paymentData: Partial<PaymentRecord>) => {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Payment created successfully');
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error creating payment:', err);
      toast.error('Failed to create payment');
      throw err;
    }
  };

  const updatePayment = async (id: string, updates: Partial<PaymentRecord>) => {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Payment updated successfully');
      await refreshData();
      return data;
    } catch (err) {
      console.error('Error updating payment:', err);
      toast.error('Failed to update payment');
      throw err;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Payment deleted successfully');
      await refreshData();
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error('Failed to delete payment');
      throw err;
    }
  };

  const approvePayment = async (approvalId: string, comments?: string) => {
    try {
      const { error } = await supabase
        .from('payment_approvals')
        .update({ 
          status: 'approved', 
          comments,
          approved_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;
      
      toast.success('Payment approved successfully');
      await refreshData();
    } catch (err) {
      console.error('Error approving payment:', err);
      toast.error('Failed to approve payment');
      throw err;
    }
  };

  const rejectPayment = async (approvalId: string, comments?: string) => {
    try {
      const { error } = await supabase
        .from('payment_approvals')
        .update({ 
          status: 'rejected', 
          comments 
        })
        .eq('id', approvalId);

      if (error) throw error;
      
      toast.success('Payment rejected');
      await refreshData();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      toast.error('Failed to reject payment');
      throw err;
    }
  };

  useEffect(() => {
    refreshData();
  }, [
    options.timeframe,
    options.currency,
    options.department,
    options.status,
    options.employeeId,
  ]);

  useEffect(() => {
    calculateStats(paymentHistory);
  }, [paymentHistory]);

  return {
    paymentHistory,
    upcomingPayments,
    pendingApprovals,
    stats,
    loading,
    error,
    refreshData,
    // CRUD operations
    createPayment,
    updatePayment,
    deletePayment,
    approvePayment,
    rejectPayment,
  };
};