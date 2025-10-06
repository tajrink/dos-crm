import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showInfo, showSuccess } from '../utils/errorHandler';
import { useNotificationStore } from '../store/notificationStore';

interface RealtimeConfig {
  table: string;
  queryKey: string[];
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  showNotifications?: boolean;
}

export const useRealTimeUpdates = (configs: RealtimeConfig[]) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  const invalidateQueries = useCallback(
    (queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  useEffect(() => {
    const channels: any[] = [];

    configs.forEach((config) => {
      const {
        table,
        queryKey,
        onInsert,
        onUpdate,
        onDelete,
        showNotifications = false,
      } = config;

      const channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
          },
          (payload) => {
            console.log(`New ${table} inserted:`, payload.new);
            
            if (onInsert) {
              onInsert(payload);
            } else {
              invalidateQueries(queryKey);
            }

            if (showNotifications) {
              showSuccess(`New ${table.slice(0, -1)} added successfully!`);
              
              // Add notification to store
              addNotification({
                title: `New ${table.slice(0, -1).charAt(0).toUpperCase() + table.slice(1, -1)} Added`,
                message: `A new ${table.slice(0, -1)} has been added to the system.`,
                type: 'success',
                actionUrl: `/${table}`,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
          },
          (payload) => {
            console.log(`${table} updated:`, payload.new);
            
            if (onUpdate) {
              onUpdate(payload);
            } else {
              invalidateQueries(queryKey);
            }

            if (showNotifications) {
              showInfo(`${table.slice(0, -1)} updated successfully!`);
              
              // Add notification to store
              addNotification({
                title: `${table.slice(0, -1).charAt(0).toUpperCase() + table.slice(1, -1)} Updated`,
                message: `A ${table.slice(0, -1)} has been updated in the system.`,
                type: 'info',
                actionUrl: `/${table}`,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table,
          },
          (payload) => {
            console.log(`${table} deleted:`, payload.old);
            
            if (onDelete) {
              onDelete(payload);
            } else {
              invalidateQueries(queryKey);
            }

            if (showNotifications) {
              showInfo(`${table.slice(0, -1)} deleted successfully!`);
            }
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [configs, invalidateQueries]);
};

// Specialized hooks for common entities
export const useClientUpdates = () => {
  useRealTimeUpdates([
    {
      table: 'clients',
      queryKey: ['clients'],
      showNotifications: true,
    },
  ]);
};

export const useProjectUpdates = () => {
  useRealTimeUpdates([
    {
      table: 'projects',
      queryKey: ['projects'],
      showNotifications: true,
    },
  ]);
};

export const useInvoiceUpdates = () => {
  useRealTimeUpdates([
    {
      table: 'invoices',
      queryKey: ['invoices'],
      showNotifications: true,
    },
  ]);
};

export const useRequestUpdates = () => {
  useRealTimeUpdates([
    {
      table: 'requests',
      queryKey: ['requests'],
      showNotifications: true,
    },
  ]);
};

export const useBudgetUpdates = () => {
  useRealTimeUpdates([
    {
      table: 'budget_categories',
      queryKey: ['budget-categories'],
    },
    {
      table: 'budget_expenses',
      queryKey: ['budget-expenses'],
    },
  ]);
};

export const useSalaryUpdates = () => {
  useRealTimeUpdates([
    {
      table: 'salary_payments',
      queryKey: ['salary-payments'],
      showNotifications: true,
    },
  ]);
};

// Hook for dashboard real-time updates
export const useDashboardUpdates = () => {
  useRealTimeUpdates([
    {
      table: 'clients',
      queryKey: ['dashboard-stats'],
    },
    {
      table: 'projects',
      queryKey: ['dashboard-stats'],
    },
    {
      table: 'invoices',
      queryKey: ['dashboard-stats'],
    },
    {
      table: 'requests',
      queryKey: ['dashboard-stats'],
    },
  ]);
};