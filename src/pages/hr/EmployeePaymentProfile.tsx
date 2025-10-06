import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Employee, PayrollRecord } from '../../types';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Download,
  FileText,
  CreditCard,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, type Currency, getAllCurrencies } from '../../utils/currency';
import { usePaymentData } from '../../hooks/usePaymentData';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';

interface PaymentStats {
  totalPaymentsUSD: number;
  totalPaymentsBDT: number;
  averageMonthlyUSD: number;
  averageMonthlyBDT: number;
  lastPaymentDate: string;
  totalPayments: number;
  onTimePayments: number;
  latePayments: number;
}

const EmployeePaymentProfile: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PayrollRecord[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'BDT' | 'both'>('both');

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
      fetchPaymentHistory();
    }
  }, [employeeId, selectedYear]);

  const fetchEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch payment history from payment_history table
      const { data: payments, error } = await supabase
        .from('payment_history')
        .select(`
          *,
          employees!inner(name, email, role, department)
        `)
        .eq('employee_id', employeeId)
        .gte('payment_date', `${selectedYear}-01-01`)
        .lte('payment_date', `${selectedYear}-12-31`)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      setPaymentHistory(payments || []);
      calculatePaymentStats(payments || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentStats = (payments: any[]) => {
    if (payments.length === 0) {
      setPaymentStats({
        totalPaymentsUSD: 0,
        totalPaymentsBDT: 0,
        averageMonthlyUSD: 0,
        averageMonthlyBDT: 0,
        lastPaymentDate: '',
        totalPayments: 0,
        onTimePayments: 0,
        latePayments: 0
      });
      return;
    }

    const totalUSD = payments
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + p.net_amount, 0);
    
    const totalBDT = payments
      .filter(p => p.currency === 'BDT')
      .reduce((sum, p) => sum + p.net_amount, 0);

    const usdPayments = payments.filter(p => p.currency === 'USD');
    const bdtPayments = payments.filter(p => p.currency === 'BDT');

    const onTime = payments.filter(p => p.status === 'paid').length;
    const late = payments.filter(p => p.status === 'failed' || p.status === 'pending').length;

    setPaymentStats({
      totalPaymentsUSD: totalUSD,
      totalPaymentsBDT: totalBDT,
      averageMonthlyUSD: usdPayments.length > 0 ? totalUSD / usdPayments.length : 0,
      averageMonthlyBDT: bdtPayments.length > 0 ? totalBDT / bdtPayments.length : 0,
      lastPaymentDate: payments[0]?.payment_date || '',
      totalPayments: payments.length,
      onTimePayments: onTime,
      latePayments: late
    });
  };

  const exportPaymentHistory = () => {
    if (paymentHistory.length === 0) return;

    const csvContent = [
      ['Date', 'Month', 'Base Amount', 'Bonus', 'Deductions', 'Net Amount', 'Currency', 'Status', 'Method'].join(','),
      ...paymentHistory.map(payment => [
        format(new Date(payment.payment_date), 'yyyy-MM-dd'),
        format(new Date(payment.payment_date), 'MMMM yyyy'),
        payment.base_amount,
        payment.bonus_amount || 0,
        payment.deduction_amount || 0,
        payment.net_amount,
        payment.currency,
        payment.status,
        payment.payment_method || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employee?.name}_payment_history_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredPayments = paymentHistory.filter(payment => {
    if (selectedCurrency === 'both') return true;
    return payment.currency === selectedCurrency;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Employee Not Found</h2>
          <button
            onClick={() => navigate('/hr/payment-dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Payment Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/hr/payment-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Profile</h1>
            <p className="text-gray-600">{employee.name} - {employee.role}</p>
          </div>
        </div>
        <button
          onClick={exportPaymentHistory}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export History</span>
        </button>
      </div>

      {/* Employee Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Employee ID</p>
              <p className="font-medium">{employee.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Briefcase className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{employee.department}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Base Salary</p>
              <p className="font-medium">
                {employee.currency === 'USD' ? '$' : '৳'}{employee.base_salary.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Statistics */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid (USD)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${paymentStats.totalPaymentsUSD.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid (BDT)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ৳{paymentStats.totalPaymentsBDT.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Time Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats.onTimePayments}/{paymentStats.totalPayments}
                </p>
                <p className="text-sm text-green-600">
                  {paymentStats.totalPayments > 0 
                    ? Math.round((paymentStats.onTimePayments / paymentStats.totalPayments) * 100)
                    : 0}% success rate
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Payment</p>
                <p className="text-lg font-bold text-gray-900">
                  {paymentStats.lastPaymentDate 
                    ? format(new Date(paymentStats.lastPaymentDate), 'MMM dd, yyyy')
                    : 'No payments'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2023, 2022, 2021].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as 'USD' | 'BDT' | 'both')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="both">All Currencies</option>
              <option value="USD">USD Only</option>
              <option value="BDT">BDT Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment History ({selectedYear})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payment records found for {selectedYear}</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(payment.payment_date), 'MMMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.currency === 'USD' ? '$' : '৳'}{payment.base_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.bonus_amount ? 
                        `${payment.currency === 'USD' ? '$' : '৳'}${payment.bonus_amount.toLocaleString()}` : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.deduction_amount ? 
                        `${payment.currency === 'USD' ? '$' : '৳'}${payment.deduction_amount.toLocaleString()}` : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.currency === 'USD' ? '$' : '৳'}{payment.net_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-1">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span>{payment.payment_method || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeePaymentProfile;