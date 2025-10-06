import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/auth/Login';
import BusinessNotificationsProvider from './components/BusinessNotificationsProvider';
import { backupService } from './services/backupService';

// Page imports (placeholder components will be created)
import Dashboard from './pages/dashboard/Dashboard';
import Clients from './pages/clients/Clients';
import Projects from './pages/projects/Projects';
import Features from './pages/features/Features';
import Invoices from './pages/invoices/Invoices';
import Reports from './pages/reports/Reports';
import Salaries from './pages/salaries/Salaries';
import Requests from './pages/requests/Requests';
import Budgets from './pages/budgets/Budgets';
import Settings from './pages/settings/Settings';

// HR System imports
import HRDashboard from './pages/hr/HRDashboard';
import Employees from './pages/hr/Employees';
import Payroll from './pages/hr/Payroll';
import HRReports from './pages/hr/Reports';
import LeaveManagement from './pages/hr/LeaveManagement';
import Performance from './pages/hr/Performance';

// Payment System imports
import PaymentHistory from './pages/hr/PaymentHistory';
import UpcomingPayments from './pages/hr/UpcomingPayments';
import EmployeePaymentProfile from './pages/hr/EmployeePaymentProfile';
import PaymentAnalytics from './pages/hr/PaymentAnalytics';
import PaymentManagement from './pages/hr/PaymentManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
    },
  },
});

function App() {
  // Initialize theme and backup service on app load
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system';
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Initialize weekly backup schedule
    backupService.startWeeklyBackupSchedule();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <BusinessNotificationsProvider>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/features" element={<Features />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/salaries" element={<Salaries />} />
                      <Route path="/requests" element={<Requests />} />
                      <Route path="/budgets" element={<Budgets />} />
                      <Route path="/settings" element={<Settings />} />
                      
                      {/* HR System Routes */}
                      <Route path="/hr/dashboard" element={<HRDashboard />} />
                      <Route path="/hr/employees" element={<Employees />} />
                      <Route path="/hr/payroll" element={<Payroll />} />
                      <Route path="/hr/reports" element={<HRReports />} />
                      <Route path="/hr/leave" element={<LeaveManagement />} />
                      <Route path="/hr/performance" element={<Performance />} />
                      
                      {/* Payment System Routes */}
                      <Route path="/hr/payments" element={<PaymentHistory />} />
                      <Route path="/hr/payments/history" element={<PaymentHistory />} />
                      <Route path="/hr/payments/upcoming" element={<UpcomingPayments />} />
                      <Route path="/hr/payments/employee/:id" element={<EmployeePaymentProfile />} />
                      <Route path="/hr/payments/analytics" element={<PaymentAnalytics />} />
                      <Route path="/hr/payments/management" element={<PaymentManagement />} />
                    </Routes>
                  </Layout>
                </BusinessNotificationsProvider>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;