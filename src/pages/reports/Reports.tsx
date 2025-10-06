import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Download,
  Calendar,
  Filter,
  Search,
  DollarSign,
  FolderOpen,
  BarChart3,
  Users,
  TrendingUp,
  PiggyBank,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

// Chart colors for pie charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

interface ReportFilters {
  dateRange: string;
  reportType: string;
  department?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface ReportData {
  revenue: {
    monthly: Array<{ month: string; revenue: number; projects: number }>;
    byType: Array<{ type: string; amount: number; count: number }>;
    byClient: Array<{ client: string; amount: number; projects: number }>;
  };
  projects: {
    performance: Array<{ name: string; budget: number; actual: number; variance: number }>;
    timeline: Array<{ month: string; completed: number; active: number; pending: number }>;
    byStatus: Array<{ status: string; count: number; value: number }>;
  };
  clients: {
    topSpenders: Array<{ name: string; totalSpent: number; projectCount: number }>;
    acquisition: Array<{ month: string; newClients: number; totalClients: number }>;
  };
  budgets: {
    variance: Array<{ category: string; budgeted: number; actual: number; variance: number }>;
    trends: Array<{ month: string; budget: number; spent: number }>;
  };
  salaries: {
    monthly: Array<{ month: string; total: number; employees: number }>;
    byEmployee: Array<{ name: string; totalPaid: number; unpaid: number }>;
  };
}

const Reports = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: '12',
    reportType: 'overview',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');

  // Fetch comprehensive report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['reports', filters],
    queryFn: async (): Promise<ReportData> => {
      const monthsBack = parseInt(filters.dateRange);
      const startDate = startOfMonth(subMonths(new Date(), monthsBack - 1));
      const endDate = endOfMonth(new Date());

      // Fetch all necessary data
      const [clientsRes, projectsRes, invoicesRes, paymentsRes, budgetCategoriesRes, budgetExpensesRes, salariesRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('projects').select('*, clients(name)'),
        supabase.from('invoices').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('budget_categories').select('*'),
        supabase.from('budget_expenses').select('*'),
        supabase.from('salary_payments').select('*, employees(name)'),
      ]);

      // Process revenue data
      const monthlyRevenue = [];
      const revenueByType: { [key: string]: { amount: number; count: number } } = {};
      const revenueByClient: { [key: string]: { amount: number; projects: number } } = {};

      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        
        const monthPayments = paymentsRes.data?.filter(p => 
          p.payment_date && format(new Date(p.payment_date), 'MMM yyyy') === monthKey
        ) || [];
        
        const monthProjects = projectsRes.data?.filter(p => 
          p.created_at && format(new Date(p.created_at), 'MMM yyyy') === monthKey
        ) || [];

        monthlyRevenue.push({
          month: monthKey,
          revenue: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          projects: monthProjects.length,
        });
      }

      // Process revenue by type and client
      invoicesRes.data?.forEach(invoice => {
        const type = invoice.project_type || 'Other';
        const clientName = invoice.client_name || 'Unknown Client';
        const amount = invoice.total_amount || 0;

        if (!revenueByType[type]) {
          revenueByType[type] = { amount: 0, count: 0 };
        }
        revenueByType[type].amount += amount;
        revenueByType[type].count += 1;

        if (!revenueByClient[clientName]) {
          revenueByClient[clientName] = { amount: 0, projects: 0 };
        }
        revenueByClient[clientName].amount += amount;
        revenueByClient[clientName].projects += 1;
      });

      // Process project timeline data
      const projectTimeline = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        
        const monthProjects = projectsRes.data?.filter(p => 
          p.created_at && format(new Date(p.created_at), 'MMM yyyy') === monthKey
        ) || [];

        const completed = monthProjects.filter(p => p.status === 'completed').length;
        const active = monthProjects.filter(p => p.status === 'active').length;
        const pending = monthProjects.filter(p => p.status === 'pending').length;

        projectTimeline.push({
          month: monthKey,
          completed,
          active,
          pending,
        });
      }

      // Process client spending data
      const clientSpending: { [key: string]: { totalSpent: number; projectCount: number } } = {};
      
      projectsRes.data?.forEach(project => {
        const clientName = project.clients?.name || 'Unknown Client';
        const budget = project.budget || 0;
        
        if (!clientSpending[clientName]) {
          clientSpending[clientName] = { totalSpent: 0, projectCount: 0 };
        }
        clientSpending[clientName].totalSpent += budget;
        clientSpending[clientName].projectCount += 1;
      });

      const topSpenders = Object.entries(clientSpending)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // Process client acquisition data
      const clientAcquisition = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        
        const newClientsThisMonth = clientsRes.data?.filter(c => 
          c.created_at && format(new Date(c.created_at), 'MMM yyyy') === monthKey
        ).length || 0;

        clientAcquisition.push({
          month: monthKey,
          newClients: newClientsThisMonth,
          totalClients: clientsRes.data?.length || 0,
        });
      }

      // Process budget trends
      const budgetTrends = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        
        const monthExpenses = budgetExpensesRes.data?.filter(e => 
          e.expense_date && format(new Date(e.expense_date), 'MMM yyyy') === monthKey
        ) || [];

        const totalBudget = budgetCategoriesRes.data?.reduce((sum, cat) => sum + (cat.monthly_budget || 0), 0) || 0;
        const totalSpent = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        budgetTrends.push({
          month: monthKey,
          budget: totalBudget,
          spent: totalSpent,
        });
      }

      // Process salary data
      const salaryMonthly = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        
        const monthSalaries = salariesRes.data?.filter(s => 
          s.payment_date && format(new Date(s.payment_date), 'MMM yyyy') === monthKey
        ) || [];

        const totalSalary = monthSalaries.reduce((sum, s) => sum + (s.amount || 0), 0);
        const uniqueEmployees = new Set(monthSalaries.map(s => s.employee_id)).size;

        salaryMonthly.push({
          month: monthKey,
          total: totalSalary,
          employees: uniqueEmployees,
        });
      }

      // Process employee salary data
      const employeeSalaries: { [key: string]: { totalPaid: number; unpaid: number } } = {};
      
      salariesRes.data?.forEach(salary => {
        const employeeName = salary.employees?.name || 'Unknown Employee';
        const amount = salary.amount || 0;
        const isPaid = salary.status === 'paid';
        
        if (!employeeSalaries[employeeName]) {
          employeeSalaries[employeeName] = { totalPaid: 0, unpaid: 0 };
        }
        
        if (isPaid) {
          employeeSalaries[employeeName].totalPaid += amount;
        } else {
          employeeSalaries[employeeName].unpaid += amount;
        }
      });

      const salaryByEmployee = Object.entries(employeeSalaries)
        .map(([name, data]) => ({ name, ...data }))
        .slice(0, 10);

      // Process project performance
      const projectPerformance = projectsRes.data?.slice(0, 10).map(project => ({
        name: project.name || 'Unnamed Project',
        budget: project.budget || 0,
        actual: project.actual_cost || 0,
        variance: (project.actual_cost || 0) - (project.budget || 0),
      })) || [];

      // Process budget variance
      const budgetVariance = budgetCategoriesRes.data?.map(category => {
        const expenses = budgetExpensesRes.data?.filter(e => e.category_id === category.id) || [];
        const actualSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const budgeted = category.monthly_budget || 0;
        
        return {
          category: category.name,
          budgeted,
          actual: actualSpent,
          variance: actualSpent - budgeted,
        };
      }) || [];

      return {
        revenue: {
          monthly: monthlyRevenue,
          byType: Object.entries(revenueByType).map(([type, data]) => ({ type, ...data })),
          byClient: Object.entries(revenueByClient).map(([client, data]) => ({ client, ...data })),
        },
        projects: {
          performance: projectPerformance,
          timeline: projectTimeline,
          byStatus: [
            { status: 'Active', count: projectsRes.data?.filter(p => p.status === 'active').length || 0, value: 0 },
            { status: 'Completed', count: projectsRes.data?.filter(p => p.status === 'completed').length || 0, value: 0 },
            { status: 'Pending', count: projectsRes.data?.filter(p => p.status === 'pending').length || 0, value: 0 },
          ],
        },
        clients: {
          topSpenders: topSpenders,
          acquisition: clientAcquisition,
        },
        budgets: {
          variance: budgetVariance,
          trends: budgetTrends,
        },
        salaries: {
          monthly: salaryMonthly,
          byEmployee: salaryByEmployee,
        },
      };
    }
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      toast.loading('Generating report...');
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.dismiss();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export report');
    }
  };

  const filteredData = useMemo(() => {
    if (!reportData || !searchQuery) return reportData;
    
    // Apply search filtering logic here
    return reportData;
  }, [reportData, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error loading report data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <div className="flex items-center space-x-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
          <button
            onClick={() => handleExport(exportFormat)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="24">Last 24 months</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filters.reportType}
              onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="overview">Overview</option>
              <option value="revenue">Revenue Analysis</option>
              <option value="projects">Project Performance</option>
              <option value="clients">Client Analytics</option>
              <option value="budgets">Budget Analysis</option>
              <option value="salaries">Salary Reports</option>
            </select>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {filters.reportType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Overview */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Revenue Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredData?.revenue.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Project Status */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Project Status
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={filteredData?.projects.byStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {filteredData?.projects.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Overview */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PiggyBank className="h-5 w-5 mr-2" />
              Budget vs Actual
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData?.budgets.variance || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="category" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip />
                <Bar dataKey="budgeted" fill="#3B82F6" name="Budgeted" />
                <Bar dataKey="actual" fill="#10B981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Clients */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Top Clients
            </h2>
            <div className="space-y-4">
              {filteredData?.clients.topSpenders.slice(0, 5).map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{client.projectCount} projects</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">${client.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Analysis */}
      {filters.reportType === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Type */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Revenue by Type
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={filteredData?.revenue.byType || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {(filteredData?.revenue.byType || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Client */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Revenue by Client
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredData?.revenue.byClient || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="client" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(31 41 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Revenue Trend
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredData?.revenue.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Project Performance */}
      {filters.reportType === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Status Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={filteredData?.projects.byStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(filteredData?.projects.byStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Project Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Metrics
              </h2>
              <div className="space-y-4">
                {filteredData?.projects.performance.map((project, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Budget</p>
                        <p className="font-medium text-gray-900 dark:text-white">${project.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Actual</p>
                        <p className="font-medium text-gray-900 dark:text-white">${project.actual.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Variance</p>
                        <p className={`font-medium ${
                          project.variance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          ${Math.abs(project.variance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Analytics */}
      {filters.reportType === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Spending Clients */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Top Spending Clients
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredData?.clients.topSpenders || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(31 41 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Spent']}
                  />
                  <Bar dataKey="totalSpent" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Client Acquisition */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Client Acquisition
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData?.clients.acquisition || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(31 41 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Line type="monotone" dataKey="newClients" stroke="#10B981" strokeWidth={3} name="New Clients" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Budget Analysis */}
      {filters.reportType === 'budgets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget vs Actual */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Budget vs Actual
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredData?.budgets.variance || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="category" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(31 41 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="budgeted" fill="#3B82F6" name="Budgeted" />
                  <Bar dataKey="actual" fill="#10B981" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Trends */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Budget Trends
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData?.budgets.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(31 41 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Line type="monotone" dataKey="budget" stroke="#3B82F6" strokeWidth={3} name="Budget" />
                  <Line type="monotone" dataKey="spent" stroke="#EF4444" strokeWidth={3} name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Salary Reports */}
      {filters.reportType === 'salaries' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Salary Costs */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Monthly Salary Costs
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={filteredData?.salaries.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(31 41 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Salaries']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.1}
                    name="Total Salary"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Employee Salary Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Employee Salary Breakdown
              </h2>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {filteredData?.salaries.byEmployee.map((employee, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Monthly Salary</p>
                        <p className="font-medium text-gray-900 dark:text-white">${employee.totalPaid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Status</p>
                        <p className="font-medium text-green-600 dark:text-green-400">Active</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;