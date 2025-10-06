import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

export const useNotifications = () => {
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();

  // Function to create notifications for different events
  const createNotification = {
    // Client notifications
    clientCreated: (clientName: string) => {
      addNotification({
        title: 'New Client Added',
        message: `${clientName} has been successfully added to your client list.`,
        type: 'success',
        actionUrl: '/clients',
      });
    },

    clientUpdated: (clientName: string) => {
      addNotification({
        title: 'Client Updated',
        message: `${clientName}'s information has been updated.`,
        type: 'info',
        actionUrl: '/clients',
      });
    },

    // Project notifications
    projectCreated: (projectName: string) => {
      addNotification({
        title: 'New Project Created',
        message: `Project "${projectName}" has been successfully created.`,
        type: 'success',
        actionUrl: '/projects',
      });
    },

    projectDeadlineApproaching: (projectName: string, daysLeft: number) => {
      addNotification({
        title: 'Project Deadline Approaching',
        message: `Project "${projectName}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
        type: 'warning',
        actionUrl: '/projects',
      });
    },

    projectCompleted: (projectName: string) => {
      addNotification({
        title: 'Project Completed',
        message: `Project "${projectName}" has been marked as completed.`,
        type: 'success',
        actionUrl: '/projects',
      });
    },

    // Invoice notifications
    invoiceCreated: (invoiceNumber: string, amount: number) => {
      addNotification({
        title: 'Invoice Created',
        message: `Invoice #${invoiceNumber} for $${amount.toLocaleString()} has been created.`,
        type: 'success',
        actionUrl: '/invoices',
      });
    },

    invoiceOverdue: (invoiceNumber: string, daysOverdue: number) => {
      addNotification({
        title: 'Invoice Overdue',
        message: `Invoice #${invoiceNumber} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.`,
        type: 'error',
        actionUrl: '/invoices',
      });
    },

    paymentReceived: (invoiceNumber: string, amount: number) => {
      addNotification({
        title: 'Payment Received',
        message: `Payment of $${amount.toLocaleString()} received for Invoice #${invoiceNumber}.`,
        type: 'success',
        actionUrl: '/invoices',
      });
    },

    // Budget notifications
    budgetExceeded: (categoryName: string, percentage: number) => {
      addNotification({
        title: 'Budget Alert',
        message: `${categoryName} budget has exceeded ${percentage}% of allocated amount.`,
        type: 'warning',
        actionUrl: '/budgets',
      });
    },

    // Request notifications
    requestCreated: (requestTitle: string) => {
      addNotification({
        title: 'New Request Created',
        message: `Request "${requestTitle}" has been submitted for review.`,
        type: 'info',
        actionUrl: '/requests',
      });
    },

    requestApproved: (requestTitle: string) => {
      addNotification({
        title: 'Request Approved',
        message: `Your request "${requestTitle}" has been approved.`,
        type: 'success',
        actionUrl: '/requests',
      });
    },

    requestDenied: (requestTitle: string, reason?: string) => {
      addNotification({
        title: 'Request Denied',
        message: `Your request "${requestTitle}" has been denied.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'error',
        actionUrl: '/requests',
      });
    },

    // Salary notifications
    salaryProcessed: (employeeName: string, amount: number) => {
      addNotification({
        title: 'Salary Processed',
        message: `Salary payment of $${amount.toLocaleString()} for ${employeeName} has been processed.`,
        type: 'success',
        actionUrl: '/salaries',
      });
    },

    // System notifications
    systemMaintenance: (scheduledTime: string) => {
      addNotification({
        title: 'Scheduled Maintenance',
        message: `System maintenance is scheduled for ${scheduledTime}. Please save your work.`,
        type: 'warning',
      });
    },

    dataBackupCompleted: () => {
      addNotification({
        title: 'Backup Completed',
        message: 'Your data has been successfully backed up.',
        type: 'success',
        actionUrl: '/settings',
      });
    },

    // Generic notification
    custom: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', actionUrl?: string) => {
      addNotification({
        title,
        message,
        type,
        actionUrl,
      });
    },
  };

  // Initialize with welcome notification for new users
  useEffect(() => {
    if (user) {
      const hasWelcomed = localStorage.getItem(`welcomed-${user.id}`);
      if (!hasWelcomed) {
        setTimeout(() => {
          addNotification({
            title: 'Welcome to DOS CRM!',
            message: 'Get started by exploring your dashboard and managing your clients.',
            type: 'info',
            actionUrl: '/dashboard',
          });
          localStorage.setItem(`welcomed-${user.id}`, 'true');
        }, 2000);
      }
    }
  }, [user, addNotification]);

  return createNotification;
};

export default useNotifications;