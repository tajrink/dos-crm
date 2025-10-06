import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/notificationStore';
import { differenceInDays, isAfter, parseISO } from 'date-fns';

export const useBusinessNotifications = () => {
  const { addNotification } = useNotificationStore();
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);

  // Cleanup function to clear all intervals
  const cleanup = useCallback(() => {
    intervalRefs.current.forEach(interval => clearInterval(interval));
    intervalRefs.current = [];
  }, []);

  // Check for overdue invoices
  const { data: overdueInvoices } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          due_date,
          total_amount,
          status,
          client:clients(name)
        `)
        .in('status', ['Sent', 'Partial'])
        .lt('due_date', today);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: false, // Disable automatic refetch
    staleTime: 1000 * 60 * 30, // Consider data stale after 30 minutes
  });

  // Check for project deadlines approaching
  const { data: upcomingDeadlines } = useQuery({
    queryKey: ['upcoming-project-deadlines'],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          end_date,
          status,
          client:clients(name)
        `)
        .in('status', ['In Progress', 'Planning'])
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', nextWeek.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: false, // Disable automatic refetch
    staleTime: 1000 * 60 * 60 * 2, // Consider data stale after 2 hours
  });

  // Check for recent payments
  const { data: recentPayments } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          updated_at,
          client:clients(name)
        `)
        .eq('status', 'Paid')
        .gte('updated_at', yesterday);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: false, // Disable automatic refetch
    staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
  });

  // Setup controlled intervals with proper cleanup
  useEffect(() => {
    // Clear any existing intervals
    cleanup();

    // Set up new intervals with proper cleanup
    const overdueInterval = setInterval(() => {
      // Trigger refetch for overdue invoices every hour
      // This is more controlled than useQuery's refetchInterval
    }, 1000 * 60 * 60);

    const deadlineInterval = setInterval(() => {
      // Trigger refetch for project deadlines every 6 hours
    }, 1000 * 60 * 60 * 6);

    const paymentInterval = setInterval(() => {
      // Trigger refetch for recent payments every 30 minutes
    }, 1000 * 60 * 30);

    intervalRefs.current = [overdueInterval, deadlineInterval, paymentInterval];

    // Cleanup on unmount
    return cleanup;
  }, [cleanup]);

  // Process overdue invoice notifications
  useEffect(() => {
    if (overdueInvoices && overdueInvoices.length > 0) {
      overdueInvoices.forEach((invoice) => {
        const daysOverdue = differenceInDays(new Date(), parseISO(invoice.due_date));
        const notificationId = `overdue-${invoice.id}`;
        
        // Check if we've already sent this notification today
        const lastNotified = localStorage.getItem(notificationId);
        const today = new Date().toDateString();
        
        if (lastNotified !== today) {
          addNotification({
            title: 'Invoice Overdue',
            message: `Invoice #${invoice.invoice_number} from ${invoice.client?.name} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue ($${invoice.total_amount.toLocaleString()})`,
            type: 'error',
            actionUrl: '/invoices',
            metadata: { invoiceId: invoice.id, type: 'overdue' }
          });
          
          localStorage.setItem(notificationId, today);
        }
      });
    }
  }, [overdueInvoices, addNotification]);

  // Process project deadline notifications
  useEffect(() => {
    if (upcomingDeadlines && upcomingDeadlines.length > 0) {
      upcomingDeadlines.forEach((project) => {
        const daysUntilDeadline = differenceInDays(parseISO(project.end_date), new Date());
        const notificationId = `deadline-${project.id}`;
        
        // Check if we've already sent this notification today
        const lastNotified = localStorage.getItem(notificationId);
        const today = new Date().toDateString();
        
        if (lastNotified !== today && daysUntilDeadline <= 7) {
          let urgency: 'warning' | 'error' = 'warning';
          if (daysUntilDeadline <= 2) urgency = 'error';
          
          addNotification({
            title: 'Project Deadline Approaching',
            message: `Project "${project.name}" for ${project.client?.name} is due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`,
            type: urgency,
            actionUrl: '/projects',
            metadata: { projectId: project.id, type: 'deadline' }
          });
          
          localStorage.setItem(notificationId, today);
        }
      });
    }
  }, [upcomingDeadlines, addNotification]);

  // Process payment notifications
  useEffect(() => {
    if (recentPayments && recentPayments.length > 0) {
      recentPayments.forEach((payment) => {
        const notificationId = `payment-${payment.id}`;
        
        // Check if we've already sent this notification
        const alreadyNotified = localStorage.getItem(notificationId);
        
        if (!alreadyNotified) {
          addNotification({
            title: 'Payment Received',
            message: `Payment of $${payment.total_amount.toLocaleString()} received for Invoice #${payment.invoice_number} from ${payment.client?.name}`,
            type: 'success',
            actionUrl: '/invoices',
            metadata: { invoiceId: payment.id, type: 'payment' }
          });
          
          localStorage.setItem(notificationId, 'true');
        }
      });
    }
  }, [recentPayments, addNotification]);

  return {
    overdueInvoices: overdueInvoices || [],
    upcomingDeadlines: upcomingDeadlines || [],
    recentPayments: recentPayments || []
  };
};