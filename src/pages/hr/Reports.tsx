import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Filter,
  FileText,
  PieChart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Employee, PayrollRecord, LeaveRequest, PerformanceReview } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';

const Reports = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last_12_months');
  const [currencyView, setCurrencyView] = useState<'USD' | 'BDT'>('USD');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all HR data
      const [employeesRes, payrollRes, leaveRes, performanceRes] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('payroll_records').select('*'),
        supabase.from('leave_requests').select('*'),
        supabase.from('performance_reviews').select('*')
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (payrollRes.error) throw payrollRes.error;
      if (leaveRes.error) throw leaveRes.error;
      if (performanceRes.error) throw performanceRes.error;

      setEmployees(employeesRes.data || []);
      setPayrollRecords(payrollRes.data || []);
      setLeaveRequests(leaveRes.data || []);
      setPerformanceReviews(performanceRes.data || []);
    } catch (error) {
      console.error('Error fetching HR data:', error);
      toast.error('Failed to fetch HR data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'BDT') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportReport = async () => {
    try {
      toast.loading('Generating HR report...');
      
      // Prepare comprehensive report data
      const reportData = {
        reportTitle: 'HR Management Report',
        generatedDate: new Date().toISOString(),
        currency: currencyView,
        summary: {
          totalEmployees: employees.length,
          totalDepartments: departmentData.length,
          totalPayrollThisMonth: Object.values(monthlyPayroll).reduce((sum, month) => sum + month.total, 0),
          activeLeaveRequests: leaveRequests.filter(req => req.status === 'pending').length,
          completedPerformanceReviews: performanceReviews.filter(rev => rev.status === 'finalized').length
        },
        departmentBreakdown: departmentData.map(dept => ({
          department: dept.department,
          employeeCount: dept.count,
          totalSalary: formatCurrency(dept.totalSalary, currencyView),
          averageSalary: formatCurrency(dept.totalSalary / dept.count, currencyView)
        })),
        monthlyPayroll: Object.values(monthlyPayroll).map(month => ({
          month: month.month,
          total: formatCurrency(month.total, currencyView)
        })),
        leaveRequestsSummary: {
          pending: leaveRequests.filter(req => req.status === 'pending').length,
          approved: leaveRequests.filter(req => req.status === 'approved').length,
          rejected: leaveRequests.filter(req => req.status === 'rejected').length
        },
        performanceReviewsSummary: {
          draft: performanceReviews.filter(rev => rev.status === 'draft').length,
          submitted: performanceReviews.filter(rev => rev.status === 'submitted').length,
          approved: performanceReviews.filter(rev => rev.status === 'approved').length,
          finalized: performanceReviews.filter(rev => rev.status === 'finalized').length
        }
      };

      // Convert to CSV format
      const csvRows = [
        // Header
        'HR Management Report',
        `Generated: ${new Date().toLocaleDateString()}`,
        `Currency: ${currencyView}`,
        '',
        // Summary
        'SUMMARY',
        `Total Employees,${reportData.summary.totalEmployees}`,
        `Total Departments,${reportData.summary.totalDepartments}`,
        `Total Payroll This Month,${formatCurrency(reportData.summary.totalPayrollThisMonth, currencyView)}`,
        `Active Leave Requests,${reportData.summary.activeLeaveRequests}`,
        `Completed Performance Reviews,${reportData.summary.completedPerformanceReviews}`,
        '',
        // Department Breakdown
        'DEPARTMENT BREAKDOWN',
        'Department,Employee Count,Total Salary,Average Salary',
        ...reportData.departmentBreakdown.map(dept => 
          `${dept.department},${dept.employeeCount},${dept.totalSalary},${dept.averageSalary}`
        ),
        '',
        // Monthly Payroll
        'MONTHLY PAYROLL',
        'Month,Total',
        ...reportData.monthlyPayroll.map(month => 
          `${month.month},${month.total}`
        ),
        '',
        // Leave Requests Summary
        'LEAVE REQUESTS SUMMARY',
        `Pending,${reportData.leaveRequestsSummary.pending}`,
        `Approved,${reportData.leaveRequestsSummary.approved}`,
        `Rejected,${reportData.leaveRequestsSummary.rejected}`,
        '',
        // Performance Reviews Summary
        'PERFORMANCE REVIEWS SUMMARY',
        `Draft,${reportData.performanceReviewsSummary.draft}`,
        `Submitted,${reportData.performanceReviewsSummary.submitted}`,
        `Approved,${reportData.performanceReviewsSummary.approved}`,
        `Finalized,${reportData.performanceReviewsSummary.finalized}`
      ];

      const csvContent = csvRows.join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `hr_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success('HR report exported successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Failed to export HR report');
    }
  };

  // Calculate department breakdown
  const departmentBreakdown = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = { department: dept, count: 0, totalSalary: 0 };
    }
    acc[dept].count++;
    // Use base_salary from employee record
    const salaryInTargetCurrency = currencyView === 'USD' 
      ? (emp.currency === 'USD' ? emp.base_salary : emp.base_salary * 0.012)
      : (emp.currency === 'BDT' ? emp.base_salary : emp.base_salary * 83);
    acc[dept].totalSalary += salaryInTargetCurrency || 0;
    return acc;
  }, {} as Record<string, { department: string; count: number; totalSalary: number }>);

  const departmentData = Object.values(departmentBreakdown);

  // Calculate monthly payroll trend
  const monthlyPayroll = payrollRecords.reduce((acc, record) => {
    const month = new Date(record.pay_period_start).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, total: 0 };
    }
    // Use net_salary from payroll records with proper currency handling
    const payrollAmount = currencyView === 'USD' 
      ? (record.net_pay_usd || record.net_salary || 0)
      : (record.net_pay_bdt || record.net_salary || 0);
    acc[month].total += payrollAmount;
    return acc;
  }, {} as Record<string, { month: string; total: number }>);

  const payrollTrendData = Object.values(monthlyPayroll)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  // Calculate leave statistics
  const leaveStats = leaveRequests.reduce((acc, request) => {
    const type = request.leave_type;
    if (!acc[type]) {
      acc[type] = { type, count: 0, days: 0 };
    }
    acc[type].count++;
    acc[type].days += request.days_requested;
    return acc;
  }, {} as Record<string, { type: string; count: number; days: number }>);

  const leaveData = Object.values(leaveStats);

  // Performance distribution
  const performanceDistribution = performanceReviews.reduce((acc, review) => {
    const rating = review.overall_rating || 0;
    const range = rating >= 4.5 ? '4.5-5.0' : 
                  rating >= 3.5 ? '3.5-4.4' :
                  rating >= 2.5 ? '2.5-3.4' :
                  rating >= 1.5 ? '1.5-2.4' : '1.0-1.4';
    
    if (!acc[range]) {
      acc[range] = { range, count: 0 };
    }
    acc[range].count++;
    return acc;
  }, {} as Record<string, { range: string; count: number }>);

  const performanceData = Object.values(performanceDistribution);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive HR analytics and insights</p>
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
            onClick={handleExportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="overview">Overview Report</option>
            <option value="payroll">Payroll Analysis</option>
            <option value="performance">Performance Report</option>
            <option value="leave">Leave Analysis</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="last_12_months">Last 12 Months</option>
            <option value="current_year">Current Year</option>
            <option value="last_year">Last Year</option>
            <option value="all_time">All Time</option>
          </select>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FileText className="h-4 w-4 mr-2" />
            {selectedReport.replace('_', ' ').toUpperCase()} REPORT
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {employees.filter(emp => emp.status === 'active').length} active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  employees.reduce((sum, emp) => {
                    const salaryInTargetCurrency = currencyView === 'USD' 
                      ? (emp.currency === 'USD' ? emp.base_salary : emp.base_salary * 0.012)
                      : (emp.currency === 'BDT' ? emp.base_salary : emp.base_salary * 83);
                    return sum + (salaryInTargetCurrency || 0);
                  }, 0),
                  currencyView
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Leave Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{leaveRequests.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {leaveRequests.filter(req => req.status === 'pending').length} pending
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {performanceReviews.length > 0 
                  ? (performanceReviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / performanceReviews.length).toFixed(1)
                  : '0.0'
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Out of 5.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Department Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payroll Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Payroll Trend ({currencyView})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={payrollTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value), currencyView)} />
              <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Leave Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie 
                data={leaveData} 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                fill="#8884d8" 
                dataKey="count"
              >
                {leaveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {leaveData.map((entry, index) => (
              <div key={entry.type} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.type}: {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Department Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg Salary
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {departmentData.map((dept) => (
                <tr key={dept.department}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {dept.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {dept.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(dept.totalSalary, currencyView)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(dept.totalSalary / dept.count, currencyView)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;