import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  UserPlus,
  UserMinus,
  Award,
  Clock,
  Building2,
  PieChart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Employee, PayrollRecord, LeaveRequest, PerformanceReview, HRAnalytics } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

const HRDashboard = () => {
  const [analytics, setAnalytics] = useState<HRAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencyView, setCurrencyView] = useState<'USD' | 'BDT'>('USD');

  useEffect(() => {
    fetchHRAnalytics();
  }, []);

  const fetchHRAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch employees data
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*');

      if (employeesError) throw employeesError;

      // Fetch current month payroll data
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const { data: payrollRecords, error: payrollError } = await supabase
        .from('payroll_records')
        .select('*')
        .gte('pay_period_start', currentMonthStart.toISOString())
        .lt('pay_period_start', nextMonthStart.toISOString());

      if (payrollError) throw new Error(payrollError.message);

      // Fetch recent activities (last 10 records)
      const { data: recentHires, error: hiresError } = await supabase
        .from('employees')
        .select('name, joining_date, role')
        .order('joining_date', { ascending: false })
        .limit(5);

      if (hiresError) throw hiresError;

      const { data: recentLeaves, error: leavesError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees!leave_requests_employee_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (leavesError) throw leavesError;

      // Calculate analytics
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(emp => emp.status === 'active').length || 0;

      // Calculate monthly payroll
      const monthlyPayrollUSD = payrollRecords?.reduce((sum, record) => sum + (record.net_pay_usd || 0), 0) || 0;
      const monthlyPayrollBDT = payrollRecords?.reduce((sum, record) => sum + (record.net_pay_bdt || 0), 0) || 0;

      // Calculate average and highest salaries
      const activeEmployeeSalaries = employees?.filter(emp => emp.status === 'active') || [];
      const averageSalaryUSD = activeEmployeeSalaries.length > 0 
          ? activeEmployeeSalaries.reduce((sum, emp) => sum + (emp.currency === 'USD' ? emp.base_salary : emp.base_salary * 0.012), 0) / activeEmployeeSalaries.length 
          : 0;
        const averageSalaryBDT = activeEmployeeSalaries.length > 0 
          ? activeEmployeeSalaries.reduce((sum, emp) => sum + (emp.currency === 'BDT' ? emp.base_salary : emp.base_salary * 83), 0) / activeEmployeeSalaries.length 
          : 0;

        const highestSalaryUSD = Math.max(...activeEmployeeSalaries.map(emp => emp.currency === 'USD' ? emp.base_salary : emp.base_salary * 0.012), 0);
        const highestSalaryBDT = Math.max(...activeEmployeeSalaries.map(emp => emp.currency === 'BDT' ? emp.base_salary : emp.base_salary * 83), 0);

      // Department breakdown
      const departmentMap = new Map();
      activeEmployeeSalaries.forEach(emp => {
        if (!departmentMap.has(emp.department)) {
          departmentMap.set(emp.department, { count: 0, totalSalaryUSD: 0, totalSalaryBDT: 0 });
        }
        const dept = departmentMap.get(emp.department);
        dept.count += 1;
        dept.totalSalaryUSD += emp.currency === 'USD' ? emp.base_salary : emp.base_salary * 0.012;
          dept.totalSalaryBDT += emp.currency === 'BDT' ? emp.base_salary : emp.base_salary * 83;
      });

      const departmentBreakdown = Array.from(departmentMap.entries()).map(([department, data]) => ({
        department,
        ...data
      }));

      // Salary distribution
      const salaryRanges = [
        { range: '$0-$2K', min: 0, max: 2000 },
        { range: '$2K-$5K', min: 2000, max: 5000 },
        { range: '$5K-$10K', min: 5000, max: 10000 },
        { range: '$10K+', min: 10000, max: Infinity }
      ];

      const salaryDistribution = salaryRanges.map(range => ({
        range: range.range,
        count: activeEmployeeSalaries.filter(emp => 
          (emp.currency === 'USD' ? emp.base_salary : emp.base_salary * 0.012) >= range.min && (emp.currency === 'USD' ? emp.base_salary : emp.base_salary * 0.012) < range.max
        ).length
      }));

      // Recent activities
      const recentActivities = [
        ...recentHires?.map(hire => ({
          id: `hire-${hire.joining_date}`,
          type: 'hire' as const,
          employee_name: hire.name,
          description: `Joined as ${hire.role}`,
          date: hire.joining_date
        })) || [],
        ...recentLeaves?.map(leave => ({
          id: `leave-${leave.id}`,
          type: 'leave_request' as const,
          employee_name: leave.employees.name,
          description: `Requested ${leave.leave_type} leave`,
          date: leave.created_at
        })) || []
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      const analyticsData: HRAnalytics = {
        totalEmployees,
        activeEmployees,
        monthlyPayrollUSD,
        monthlyPayrollBDT,
        averageSalaryUSD,
        averageSalaryBDT,
        highestSalaryUSD,
        highestSalaryBDT,
        departmentBreakdown,
        salaryDistribution,
        recentActivities
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching HR analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'BDT') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString()}`;
    } else {
      return `৳${amount.toLocaleString()}`;
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of human resources metrics and activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrencyView('USD')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currencyView === 'USD'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setCurrencyView('BDT')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currencyView === 'BDT'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            BDT
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.totalEmployees}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {analytics?.activeEmployees} active
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Payroll</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currencyView === 'USD' 
                  ? formatCurrency(analytics?.monthlyPayrollUSD || 0, 'USD')
                  : formatCurrency(analytics?.monthlyPayrollBDT || 0, 'BDT')
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current month</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Salary</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currencyView === 'USD' 
                  ? formatCurrency(analytics?.averageSalaryUSD || 0, 'USD')
                  : formatCurrency(analytics?.averageSalaryBDT || 0, 'BDT')
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Per employee</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest Salary</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currencyView === 'USD' 
                  ? formatCurrency(analytics?.highestSalaryUSD || 0, 'USD')
                  : formatCurrency(analytics?.highestSalaryBDT || 0, 'BDT')
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Top earner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Department Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.departmentBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'count' ? value : formatCurrency(value as number, currencyView),
                  name === 'count' ? 'Employees' : `Total Salary (${currencyView})`
                ]}
              />
              <Bar dataKey="count" fill="#3B82F6" name="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Salary Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Salary Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Tooltip formatter={(value) => [`${value} employees`, 'Count']} />
              <RechartsPieChart data={analytics?.salaryDistribution}>
                {analytics?.salaryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </RechartsPieChart>
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {analytics?.salaryDistribution.map((entry, index) => (
              <div key={entry.range} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.range}: {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activities
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics?.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'hire' 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : activity.type === 'leave_request'
                    ? 'bg-yellow-100 dark:bg-yellow-900'
                    : 'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {activity.type === 'hire' && <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {activity.type === 'leave_request' && <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                  {activity.type === 'termination' && <UserMinus className="h-4 w-4 text-red-600 dark:text-red-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.employee_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.date).toLocaleDateString()}
                </div>
              </div>
            ))}
            {(!analytics?.recentActivities || analytics.recentActivities.length === 0) && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent activities found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;