import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PayrollRecord, Employee } from '../../types';
import toast from 'react-hot-toast';
import PayrollModal from '../../components/modals/PayrollModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const Payroll = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyView, setCurrencyView] = useState<'USD' | 'BDT'>('USD');
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<PayrollRecord | null>(null);
  const [payrollModalMode, setPayrollModalMode] = useState<'add' | 'edit'>('add');
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    record: null as PayrollRecord | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payroll records with employee data
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_records')
        .select(`
          *,
          employees!payroll_records_employee_id_fkey(name, email, department, role)
        `)
        .order('created_at', { ascending: false });

      if (payrollError) throw new Error(payrollError.message);

      // Fetch employees for stats
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active');

      if (employeesError) throw employeesError;

      setPayrollRecords(payrollData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      toast.error('Failed to fetch payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayrollRecord = () => {
    setSelectedPayrollRecord(null);
    setPayrollModalMode('add');
    setShowPayrollModal(true);
  };

  const handleEditPayrollRecord = (record: PayrollRecord) => {
    setSelectedPayrollRecord(record);
    setPayrollModalMode('edit');
    setShowPayrollModal(true);
  };

  const handleViewPayrollRecord = (record: PayrollRecord) => {
    setSelectedPayrollRecord(record);
    setPayrollModalMode('view');
    setShowPayrollModal(true);
  };

  const handleDeletePayrollRecord = (record: PayrollRecord) => {
    setConfirmationModal({
      isOpen: true,
      record: record,
    });
  };

  const handleConfirmDelete = async () => {
    if (confirmationModal.record) {
      try {
        const { error } = await supabase
          .from('payroll_records')
          .delete()
          .eq('id', confirmationModal.record.id);

        if (error) throw error;
        
        toast.success('Payroll record deleted successfully');
        fetchData();
        setConfirmationModal({ isOpen: false, record: null });
      } catch (error: any) {
        console.error('Error deleting payroll record:', error);
        toast.error('Failed to delete payroll record');
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, record: null });
  };

  const handleExportPayroll = async () => {
    try {
      toast.loading('Exporting payroll data...');
      
      // Prepare data for export
      const exportData = filteredRecords.map(record => {
        const employee = employees.find(emp => emp.id === record.employee_id);
        return {
          'Employee Name': employee?.name || 'Unknown',
          'Employee ID': record.employee_id,
          'Pay Period Start': record.pay_period_start,
          'Pay Period End': record.pay_period_end,
          'Base Salary': formatCurrency(record.base_salary || 0, record.currency || currencyView),
          'Overtime Hours': record.overtime_hours || 0,
          'Overtime Rate': formatCurrency(record.overtime_rate || 0, record.currency || currencyView),
          'Bonuses': formatCurrency(record.bonuses || 0, record.currency || currencyView),
          'Deductions': formatCurrency(record.deductions || 0, record.currency || currencyView),
          'Gross Pay': formatCurrency(
            (record.base_salary || 0) + 
            (record.overtime_hours || 0) * (record.overtime_rate || 0) + 
            (record.bonuses || 0),
            record.currency || currencyView
          ),
          'Net Pay': formatCurrency(record.net_salary || 0, record.currency || currencyView),
          'Status': record.status,
          'Currency': record.currency || currencyView,
          'Created At': new Date(record.created_at).toLocaleDateString()
        };
      });

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success('Payroll data exported successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Failed to export payroll data');
    }
  };

  const handlePayrollRecordSave = () => {
    fetchData();
  };

  const filteredRecords = payrollRecords.filter(record => {
    const employee = record.employees;
    const matchesSearch = 
      employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: 'USD' | 'BDT') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Calculate stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthRecords = payrollRecords.filter(record => 
    record.pay_period_start.startsWith(currentMonth)
  );
  
  // Fix total payroll calculation - use net_salary field from database
  const totalPayroll = currentMonthRecords.reduce((sum, record) => {
    // Convert to display currency if needed
    if (record.currency === currencyView) {
      return sum + (record.net_salary || 0);
    } else {
      // Simple conversion - in real app, use proper exchange rates
      const rate = currencyView === 'USD' ? 0.0092 : 108.7; // USD to BDT rate
      return sum + ((record.net_salary || 0) * rate);
    }
  }, 0);
  
  const paidRecords = currentMonthRecords.filter(record => record.status === 'paid');
  const pendingRecords = currentMonthRecords.filter(record => record.status === 'draft' || record.status === 'processed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage employee payroll and salary payments</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCurrencyView('USD')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currencyView === 'USD'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrencyView('BDT')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currencyView === 'BDT'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              BDT
            </button>
          </div>
          <button 
            onClick={handleExportPayroll}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={handleAddPayrollRecord}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Process Payroll
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalPayroll, currencyView)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Employees Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{paidRecords.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRecords.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting processing</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Salary</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {employees.length > 0 
                  ? formatCurrency(
                      employees.reduce((sum, emp) => sum + emp.base_salary, 0) / employees.length,
                      currencyView
                    )
                  : formatCurrency(0, currencyView)
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Filter className="h-4 w-4 mr-2" />
            {filteredRecords.length} of {payrollRecords.length} records
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pay Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {record.employees?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.employees?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.employees?.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      {new Date(record.pay_period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.payment_date ? new Date(record.payment_date).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.payment_by || 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                     {formatCurrency(
                       record.net_salary || 0,
                       record.currency || currencyView
                     )}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                       {record.status}
                     </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        title="View Details"
                        onClick={() => handleViewPayrollRecord(record)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        title="Edit Record"
                        onClick={() => handleEditPayrollRecord(record)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        title="Delete Record"
                        onClick={() => handleDeletePayrollRecord(record)}
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

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payroll records found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by processing your first payroll.'}
            </p>
          </div>
        )}
      </div>

      {/* Payroll Modal */}
      <PayrollModal
        isOpen={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        onSave={handlePayrollRecordSave}
        payrollRecord={selectedPayrollRecord}
        mode={payrollModalMode}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Payroll Record"
        message={`Are you sure you want to delete the payroll record for ${confirmationModal.record?.employees?.name || 'this employee'}? This action cannot be undone.`}
        confirmText="Delete Record"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Payroll;