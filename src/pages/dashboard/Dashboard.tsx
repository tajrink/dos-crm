import React, { useEffect, useState } from 'react';
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  FolderOpen,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardUpdates } from '../../hooks/useRealTimeUpdates';
import { useApiRetry } from '../../hooks/useRetry';
import { ErrorHandler, showError } from '../../utils/errorHandler';
import { PageLoader, SkeletonCard } from '../../components/LoadingSpinner';

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  pendingInvoices: number;
  grossRevenue: number;
  netRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  projectsByStatus: Array<{ status: string; count: number; color: string }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
  previousMonth?: {
    totalClients: number;
    activeProjects: number;
    pendingInvoices: number;
    grossRevenue: number;
    netRevenue: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const generateMonthlyRevenue = (paidInvoices: any[]) => {
  const monthlyData: { [key: string]: number } = {};
  const last6Months = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = format(date, 'MMM yyyy');
    last6Months.push(monthKey);
    monthlyData[monthKey] = 0;
  }

  paidInvoices.forEach(invoice => {
    if (invoice.created_at) {
      const monthKey = format(new Date(invoice.created_at), 'MMM yyyy');
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += invoice.total_amount || 0;
      }
    }
  });

  return last6Months.map(month => ({
    month,
    revenue: monthlyData[month],
  }));
};

const generateProjectsByStatus = (projects: any[]) => {
  const statusCounts: { [key: string]: number } = {};
  projects.forEach(project => {
    statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
  });

  const statusColors: { [key: string]: string } = {
    active: '#10B981',
    completed: '#3B82F6',
    pending: '#F59E0B',
    cancelled: '#EF4444',
  };

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    color: statusColors[status] || '#8B5CF6',
  }));
};

const generateRecentActivity = (projects: any[], invoices: any[], paidInvoices: any[]) => {
  const activities: any[] = [];

  // Add recent projects
  projects.slice(0, 3).forEach(project => {
    activities.push({
      id: `project-${project.id}`,
      type: 'project',
      description: `Project created with status: ${project.status}`,
      date: project.created_at,
    });
  });

  // Add recent invoices
  invoices.slice(0, 3).forEach(invoice => {
    activities.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      description: `Invoice ${invoice.status} - $${invoice.total_amount || 0}`,
      date: invoice.created_at || new Date().toISOString(),
    });
  });

  // Add recent paid invoices
  paidInvoices.slice(0, 2).forEach(invoice => {
    activities.push({
      id: `payment-${invoice.id}`,
      type: 'payment',
      description: `Payment received - $${invoice.total_amount}`,
      date: invoice.created_at,
    });
  });

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): { change: string; trend: 'up' | 'down' } => {
  if (previous === 0) {
    return current > 0 ? { change: '+100%', trend: 'up' } : { change: '0%', trend: 'up' };
  }
  
  const percentChange = ((current - previous) / previous) * 100;
  const isPositive = percentChange >= 0;
  
  return {
    change: `${isPositive ? '+' : ''}${Math.round(percentChange)}%`,
    trend: isPositive ? 'up' : 'down'
  };
};

// Helper function to get date ranges for current and previous month
const getDateRanges = () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return {
    current: {
      start: currentMonthStart.toISOString(),
      end: currentMonthEnd.toISOString()
    },
    previous: {
      start: previousMonthStart.toISOString(),
      end: previousMonthEnd.toISOString()
    }
  };
};

const Dashboard = () => {
  console.log('Dashboard component mounted');
  
  const [dateRange, setDateRange] = useState('30');
  const { executeWithRetry, isRetrying, manualRetry } = useApiRetry();

  // Enable real-time updates for dashboard
  useDashboardUpdates();

  // Simple test query to check if React Query is working
  const { data: testData, isLoading: testLoading } = useQuery({
    queryKey: ['test-query'],
    queryFn: async () => {
      console.log('TEST QUERY: Function called!');
      return { test: 'success', timestamp: Date.now() };
    },
    enabled: true,
  });
  
  console.log('TEST QUERY RESULT:', { testData, testLoading });

  // Dashboard query with real database data
  const { data: stats, isLoading, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Dashboard query function called!');
      
      try {
        console.debug('Dashboard: Fetching data...');
        
        const dateRanges = getDateRanges();
        
        // Fetch current month data
        const [clientsRes, projectsRes, invoicesRes, paidInvoicesRes, expensesRes] = await Promise.all([
          supabase.from('clients').select('id, created_at'),
          supabase.from('projects').select('id, status, created_at'),
          supabase.from('invoices').select('id, status, total_amount, created_at'),
          supabase.from('invoices').select('id, status, total_amount, created_at').eq('status', 'Paid'),
          supabase.from('payment_history').select('amount, payment_date, status')
            .gte('payment_date', dateRanges.current.start)
            .lte('payment_date', dateRanges.current.end),
        ]);
        
        // Fetch previous month data for comparison
        const [prevClientsRes, prevProjectsRes, prevInvoicesRes, prevPaidInvoicesRes, prevExpensesRes] = await Promise.all([
          supabase
            .from('clients')
            .select('id')
            .gte('created_at', dateRanges.previous.start)
            .lte('created_at', dateRanges.previous.end),
          supabase
            .from('projects')
            .select('id, status')
            .gte('created_at', dateRanges.previous.start)
            .lte('created_at', dateRanges.previous.end),
          supabase
            .from('invoices')
            .select('id, status')
            .gte('created_at', dateRanges.previous.start)
            .lte('created_at', dateRanges.previous.end),
          supabase
            .from('invoices')
            .select('id, status, total_amount')
            .eq('status', 'Paid')
            .gte('created_at', dateRanges.previous.start)
            .lte('created_at', dateRanges.previous.end),
          supabase
            .from('payment_history')
            .select('amount')
            .gte('payment_date', dateRanges.previous.start)
            .lte('payment_date', dateRanges.previous.end),
        ]);
        
        console.debug('Dashboard: Data fetched', {
          clients: clientsRes.data?.length || 0,
          projects: projectsRes.data?.length || 0,
          invoices: invoicesRes.data?.length || 0,
          paidInvoices: paidInvoicesRes.data?.length || 0,
          expenses: expensesRes.data?.length || 0
        });

        if (clientsRes.error) throw clientsRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (invoicesRes.error) throw invoicesRes.error;
        if (paidInvoicesRes.error) throw paidInvoicesRes.error;
        if (expensesRes.error) throw expensesRes.error;

        // Current month stats
        const totalClients = clientsRes.data?.length || 0;
        const activeProjects = (projectsRes.data || []).filter((p: any) => p.status === 'active').length;
        const pendingInvoices = (invoicesRes.data || []).filter((i: any) => i.status === 'Draft').length;
        
        // Calculate Gross Revenue (from paid invoices)
        console.log('=== DASHBOARD REVENUE CALCULATION ===');
        console.log('Paid invoices data received:', paidInvoicesRes.data?.length || 0, 'records');
        
        let grossRevenue = 0;
        (paidInvoicesRes.data || []).forEach((invoice: any, index: number) => {
          const amount = invoice.total_amount || 0;
          grossRevenue += amount;
          console.log(`Invoice ${index + 1}: ID=${invoice.id}, Amount=${amount}, Status=${invoice.status}, Running Total=${grossRevenue}`);
        });
        
        // Calculate Total Expenses (from payment_history)
        console.log('Employee expenses data received:', expensesRes.data?.length || 0, 'records');
        
        let totalExpenses = 0;
        (expensesRes.data || []).forEach((expense: any, index: number) => {
          const amount = expense.amount || 0;
          totalExpenses += amount;
          console.log(`Expense ${index + 1}: Amount=${amount}, Status=${expense.status}, Running Total=${totalExpenses}`);
        });
        
        // Calculate Net Revenue (Gross Revenue - Expenses)
        const netRevenue = grossRevenue - totalExpenses;
        
        console.log('Final Gross Revenue:', grossRevenue);
        console.log('Total Expenses:', totalExpenses);
        console.log('Final Net Revenue:', netRevenue);
        console.log('=== END REVENUE CALCULATION ===');

        // Previous month stats for comparison
        const prevTotalClients = prevClientsRes.data?.length || 0;
        const prevActiveProjects = (prevProjectsRes.data || []).filter((p: any) => p.status === 'active').length;
        const prevPendingInvoices = (prevInvoicesRes.data || []).filter((i: any) => i.status === 'Draft').length;
        const prevGrossRevenue = (prevPaidInvoicesRes.data || []).reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
        const prevTotalExpenses = (prevExpensesRes.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const prevNetRevenue = prevGrossRevenue - prevTotalExpenses;

        // Generate monthly revenue data
        const monthlyRevenue = generateMonthlyRevenue(paidInvoicesRes.data || []);

        // Generate project status distribution
        const projectsByStatus = generateProjectsByStatus(projectsRes.data || []);

        // Generate recent activity
        const recentActivity = generateRecentActivity(
          projectsRes.data || [],
          invoicesRes.data || [],
          paidInvoicesRes.data || []
        );

        console.log('Dashboard: Returning stats', {
          totalClients,
          activeProjects,
          pendingInvoices,
          grossRevenue,
          netRevenue,
          prevStats: { prevTotalClients, prevActiveProjects, prevPendingInvoices, prevGrossRevenue, prevNetRevenue }
        });

        return {
          totalClients,
          activeProjects,
          pendingInvoices,
          grossRevenue,
          netRevenue,
          monthlyRevenue,
          projectsByStatus,
          recentActivity,
          // Add previous month data for percentage calculations
          previousMonth: {
            totalClients: prevTotalClients,
            activeProjects: prevActiveProjects,
            pendingInvoices: prevPendingInvoices,
            grossRevenue: prevGrossRevenue,
            netRevenue: prevNetRevenue,
          }
        };
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        throw err;
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle error separately if needed
  if (error) {
    console.error('Dashboard useQuery error:', error);
    showError(error, 'Dashboard');
  }
  
  console.log('Dashboard: useQuery config:', {
    queryKey: ['dashboard-stats', dateRange],
    enabled: true,
    isLoading,
    error,
    hasData: !!stats
  });

  const handleManualRefresh = async () => {
    try {
      await manualRetry(() => refetch());
    } catch {
      // Error already handled by the retry hook
    }
  };

  console.log('Dashboard render state:', { isLoading, isRetrying, hasData: !!stats, error });
  
  if (isLoading || isRetrying) {
    console.log('Dashboard showing loading state');
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          {isRetrying && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Retrying...</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    const errorInfo = ErrorHandler.handle(error, 'Dashboard');
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button
            onClick={handleManualRefresh}
            disabled={isRetrying}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Dashboard Error</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{errorInfo.message}</p>
          {errorInfo.code && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">Error Code: {errorInfo.code}</p>
          )}
          <div className="flex space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRetrying}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      ...calculatePercentageChange(
        stats?.totalClients || 0,
        stats?.previousMonth?.totalClients || 0
      ),
    },
    {
      title: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: FolderOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      ...calculatePercentageChange(
        stats?.activeProjects || 0,
        stats?.previousMonth?.activeProjects || 0
      ),
    },
    {
      title: 'Pending Invoices',
      value: stats?.pendingInvoices || 0,
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      ...calculatePercentageChange(
        stats?.pendingInvoices || 0,
        stats?.previousMonth?.pendingInvoices || 0
      ),
    },
    {
      title: 'Gross Revenue',
      value: `$${(stats?.grossRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      ...calculatePercentageChange(
        stats?.grossRevenue || 0,
        stats?.previousMonth?.grossRevenue || 0
      ),
    },
    {
      title: 'Net Revenue',
      value: `$${(stats?.netRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      ...calculatePercentageChange(
        stats?.netRevenue || 0,
        stats?.previousMonth?.netRevenue || 0
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          {isRetrying && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm font-medium">Updating...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRetrying || isLoading}
            className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            disabled={isLoading || isRetrying}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendIcon className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'} mr-1`} />
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.monthlyRevenue || []}>
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
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Projects by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.projectsByStatus || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(stats?.projectsByStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Recent Activity
        </h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => {
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'project':
                    return <FolderOpen className="h-4 w-4 text-blue-500" />;
                  case 'invoice':
                    return <FileText className="h-4 w-4 text-yellow-500" />;
                  case 'payment':
                    return <DollarSign className="h-4 w-4 text-green-500" />;
                  default:
                    return <Activity className="h-4 w-4 text-gray-500" />;
                }
              };

              return (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(activity.date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No recent activity to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;