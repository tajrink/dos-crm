import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Building2,
  User,
  Palette,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Save,
  Moon,
  Sun,
  Globe,
  Settings as SettingsIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { backupService } from '../../services/backupService';

// Form schemas
const companyProfileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  taxId: z.string().optional(),
  logo: z.string().optional(),
});

const userProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  currency: z.string().min(1, 'Currency is required'),
});

type CompanyProfile = z.infer<typeof companyProfileSchema>;
type UserProfile = z.infer<typeof userProfileSchema>;

interface SystemSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    invoiceReminders: boolean;
    projectUpdates: boolean;
    paymentAlerts: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
  };
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    theme: 'system',
    notifications: {
      invoiceReminders: true,
      projectUpdates: true,
      paymentAlerts: true,
    },
    backup: {
      autoBackup: false,
      backupFrequency: 'weekly',
      retentionDays: 30,
    },
  });

  const queryClient = useQueryClient();

  // Save system settings mutation
  const saveSystemSettingsMutation = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      // Save to localStorage for now (can be changed to database later)
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return settings;
    },
    onSuccess: () => {
      toast.success('System settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error) => {
      console.error('Failed to save system settings:', error);
      toast.error('Failed to save system settings. Please try again.');
    },
  });

  // Company profile form
  const companyForm = useForm<CompanyProfile>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: 'Devs On Steroids',
      email: 'contact@devsonsteroids.com',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      website: 'https://devsonsteroids.com',
      taxId: 'TAX123456789',
      logo: '',
    },
  });

  // User profile form
  const userForm = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: 'Admin User',
      email: 'admin@devsonsteroids.com',
      phone: '+1 (555) 987-6543',
      timezone: 'America/Los_Angeles',
      dateFormat: 'MM/dd/yyyy',
      currency: 'USD',
    },
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch company profile from database
  const { data: companyProfile } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      // Try to get from database first, fallback to localStorage
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist or other error, use localStorage
        const saved = localStorage.getItem('company_profile');
        return saved ? JSON.parse(saved) : null;
      }
      
      return data;
    },
  });

  // Fetch user profile from database
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Try to get from database first, fallback to localStorage
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist or other error, use localStorage
        const saved = localStorage.getItem('user_profile');
        return saved ? JSON.parse(saved) : null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Save company profile mutation
  const saveCompanyProfile = useMutation({
    mutationFn: async (data: CompanyProfile) => {
      // Try to save to database first, fallback to localStorage
      try {
        const { error } = await supabase
          .from('company_settings')
          .upsert([{ ...data, id: 1 }]); // Use fixed ID for single company
        
        if (error) throw error;
        return data;
      } catch {
        // Fallback to localStorage if database fails
        localStorage.setItem('company_profile', JSON.stringify(data));
        return data;
      }
    },
    onSuccess: () => {
      toast.success('Company profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
    onError: () => {
      toast.error('Failed to update company profile');
    },
  });

  // Save user profile mutation
  const saveUserProfile = useMutation({
    mutationFn: async (data: UserProfile) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Try to save to database first, fallback to localStorage
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert([{ ...data, user_id: user.id }]);
        
        if (error) throw error;
        return data;
      } catch {
        // Fallback to localStorage if database fails
        localStorage.setItem('user_profile', JSON.stringify(data));
        return data;
      }
    },
    onSuccess: () => {
      toast.success('User profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => {
      toast.error('Failed to update user profile');
    },
  });

  // Handle password change
  const handlePasswordChange = async () => {
    const newPassword = prompt('Enter your new password:');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    try {
      toast.loading('Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.dismiss();
      toast.success('Password updated successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Password update error:', error);
      toast.error('Failed to update password');
    }
  };

  // Import data function
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Importing data...');
      
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate the import data structure
      if (!importData.version || !importData.exportDate) {
        throw new Error('Invalid backup file format');
      }
      
      // Clear existing data (optional - you might want to ask user first)
      const confirmImport = window.confirm(
        'This will replace all existing data with the imported data. Are you sure you want to continue?'
      );
      
      if (!confirmImport) {
        toast.dismiss();
        return;
      }
      
      // Import data to each table
      const tables = [
        'clients', 'projects', 'invoices', 'payments', 'employees',
        'budget_categories', 'budget_expenses', 'salary_payments',
        'features', 'requests', 'payroll_records'
      ];
      
      for (const table of tables) {
        if (importData[table] && importData[table].length > 0) {
          // Delete existing data
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          
          // Insert new data
          const { error } = await supabase.from(table).insert(importData[table]);
          if (error) {
            console.error(`Error importing ${table}:`, error);
            throw new Error(`Failed to import ${table} data`);
          }
        }
      }
      
      // Update profiles and settings
      if (importData.companyProfile) {
        await saveCompanyProfile.mutateAsync(importData.companyProfile);
      }
      
      if (importData.userProfile) {
        await saveUserProfile.mutateAsync(importData.userProfile);
      }
      
      if (importData.systemSettings) {
        setSystemSettings(importData.systemSettings);
        localStorage.setItem('systemSettings', JSON.stringify(importData.systemSettings));
      }
      
      toast.dismiss();
      toast.success('Data imported successfully');
      
      // Refresh the page to reload all data
      window.location.reload();
      
    } catch (error) {
      toast.dismiss();
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import data');
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Export data function
  const exportData = async () => {
    try {
      toast.loading('Exporting data...');
      
      // Fetch all data from database
      const { data: clients } = await supabase.from('clients').select('*');
      const { data: projects } = await supabase.from('projects').select('*');
      const { data: invoices } = await supabase.from('invoices').select('*');
      const { data: payments } = await supabase.from('payments').select('*');
      const { data: employees } = await supabase.from('employees').select('*');
      const { data: budgetCategories } = await supabase.from('budget_categories').select('*');
      const { data: budgetExpenses } = await supabase.from('budget_expenses').select('*');
      const { data: salaryPayments } = await supabase.from('salary_payments').select('*');
      const { data: features } = await supabase.from('features').select('*');
      const { data: requests } = await supabase.from('requests').select('*');
      const { data: payrollRecords } = await supabase.from('payroll_records').select('*');
      
      const exportData = {
        clients: clients || [],
        projects: projects || [],
        invoices: invoices || [],
        payments: payments || [],
        employees: employees || [],
        budgetCategories: budgetCategories || [],
        budgetExpenses: budgetExpenses || [],
        salaryPayments: salaryPayments || [],
        features: features || [],
        requests: requests || [],
        payrollRecords: payrollRecords || [],
        companyProfile: companyProfile || {},
        userProfile: userProfile || {},
        systemSettings: systemSettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Theme toggle effect
  useEffect(() => {
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
  }, [theme]);

  // Load system settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSystemSettings(parsedSettings);
        setTheme(parsedSettings.theme);
      } catch (err) {
        console.error('Failed to load system settings:', err);
      }
    }
  }, []);

  // Update company form when data is loaded
  useEffect(() => {
    if (companyProfile) {
      companyForm.reset({
        name: companyProfile.name || 'Devs On Steroids',
        email: companyProfile.email || 'contact@devsonsteroids.com',
        phone: companyProfile.phone || '+1 (555) 123-4567',
        address: companyProfile.address || '123 Tech Street, Silicon Valley, CA 94000',
        website: companyProfile.website || 'https://devsonsteroids.com',
        taxId: companyProfile.taxId || 'TAX123456789',
        logo: companyProfile.logo || '',
      });
    }
  }, [companyProfile, companyForm]);

  // Update user form when data is loaded
  useEffect(() => {
    if (userProfile) {
      userForm.reset({
        fullName: userProfile.fullName || userProfile.full_name || user?.user_metadata?.full_name || 'Admin User',
        email: userProfile.email || user?.email || 'admin@devsonsteroids.com',
        phone: userProfile.phone || '+1 (555) 987-6543',
        timezone: userProfile.timezone || 'America/Los_Angeles',
        dateFormat: userProfile.dateFormat || userProfile.date_format || 'MM/dd/yyyy',
        currency: userProfile.currency || 'USD',
      });
    } else if (user) {
      // If no profile exists, use user data from auth
      userForm.reset({
        fullName: user.user_metadata?.full_name || 'Admin User',
        email: user.email || 'admin@devsonsteroids.com',
        phone: '+1 (555) 987-6543',
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/dd/yyyy',
        currency: 'USD',
      });
    }
  }, [userProfile, user, userForm]);

  // Save system settings function
  const handleSaveSystemSettings = () => {
    saveSystemSettingsMutation.mutate(systemSettings);
  };

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'user', label: 'User Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup & Export', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <SettingsIcon className="h-8 w-8 mr-3" />
          Settings
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Building2 className="h-6 w-6 mr-2" />
                Company Profile
              </h2>
              
              <form onSubmit={companyForm.handleSubmit((data) => saveCompanyProfile.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      {...companyForm.register('name')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {companyForm.formState.errors.name && (
                      <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      {...companyForm.register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {companyForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      {...companyForm.register('phone')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {companyForm.formState.errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      {...companyForm.register('website')}
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {companyForm.formState.errors.website && (
                      <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.website.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    {...companyForm.register('address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  {companyForm.formState.errors.address && (
                    <p className="text-red-500 text-sm mt-1">{companyForm.formState.errors.address.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tax ID
                  </label>
                  <input
                    {...companyForm.register('taxId')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saveCompanyProfile.isPending}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveCompanyProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <User className="h-6 w-6 mr-2" />
                User Profile
              </h2>
              
              <form onSubmit={userForm.handleSubmit((data) => saveUserProfile.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      {...userForm.register('fullName')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {userForm.formState.errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{userForm.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      {...userForm.register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {userForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{userForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      {...userForm.register('phone')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      {...userForm.register('timezone')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      {...userForm.register('dateFormat')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                      <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                      <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      {...userForm.register('currency')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saveUserProfile.isPending}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveUserProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Palette className="h-6 w-6 mr-2" />
                Appearance
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Globe },
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value as 'light' | 'dark' | 'system');
                            setSystemSettings(prev => ({ ...prev, theme: option.value as 'light' | 'dark' | 'system' }));
                          }}
                          className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                            theme === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Bell className="h-6 w-6 mr-2" />
                Notifications
              </h2>
              
              <div className="space-y-6">
                {[
                  { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Reminders for overdue invoices' },
                  { key: 'projectUpdates', label: 'Project Updates', description: 'Notifications for project changes' },
                  { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Alerts for received payments' },
                ].map((notification) => (
                  <div key={notification.key} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {notification.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.notifications[notification.key as keyof typeof systemSettings.notifications]}
                        onChange={(e) => {
                          setSystemSettings(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [notification.key]: e.target.checked,
                            },
                          }));
                        }}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 ${
                        systemSettings.notifications[notification.key as keyof typeof systemSettings.notifications] 
                          ? 'bg-blue-600' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                        systemSettings.notifications[notification.key as keyof typeof systemSettings.notifications] 
                          ? 'after:translate-x-full after:border-white' 
                          : ''
                      }`}></div>
                    </label>
                  </div>
                ))}
                
                {/* Save Button for Notifications */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveSystemSettings}
                    disabled={saveSystemSettingsMutation.isPending}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveSystemSettingsMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Shield className="h-6 w-6 mr-2" />
                Security
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Authentication Status
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    You are currently signed in with Supabase Auth. Your session is secure and encrypted.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Security</h3>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg max-w-md">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Password</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Change your account password
                    </p>
                    <button 
                      onClick={handlePasswordChange}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Database className="h-6 w-6 mr-2" />
                Backup & Export
              </h2>
              
              <div className="space-y-6">
                {/* Auto Backup Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Automatic Backup</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Enable Auto Backup</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Automatically backup your data</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.backup.autoBackup}
                          onChange={(e) => {
                            setSystemSettings(prev => ({
                              ...prev,
                              backup: {
                                ...prev.backup,
                                autoBackup: e.target.checked,
                              },
                            }));
                          }}
                          className="sr-only"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Backup Frequency
                        </label>
                        <select
                          value={systemSettings.backup.backupFrequency}
                          onChange={(e) => {
                            setSystemSettings(prev => ({
                              ...prev,
                              backup: {
                                ...prev.backup,
                                backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                              },
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Retention (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={systemSettings.backup.retentionDays}
                          onChange={(e) => {
                            setSystemSettings(prev => ({
                              ...prev,
                              backup: {
                                ...prev.backup,
                                retentionDays: parseInt(e.target.value) || 30,
                              },
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Save Button for Backup Settings */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleSaveSystemSettings}
                        disabled={saveSystemSettingsMutation.isPending}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveSystemSettingsMutation.isPending ? 'Saving...' : 'Save Backup Settings'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Manual Export */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manual Export</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Download all your CRM data as JSON
                      </p>
                      <button
                        onClick={exportData}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Now
                      </button>
                    </div>
                    
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Import data from JSON backup file
                      </p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        id="import-file"
                      />
                      <label
                        htmlFor="import-file"
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </label>
                    </div>
                    
                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Auto Backup
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Weekly automated backup to inkcansaylot@gmail.com (Sundays 2:00 AM)
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            toast.loading('Triggering manual backup...');
                            await backupService.triggerManualBackup();
                            toast.dismiss();
                            toast.success('Manual backup completed and sent via email');
                          } catch (error) {
                            toast.dismiss();
                            toast.error('Manual backup failed');
                            console.error('Manual backup error:', error);
                          }
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Test Backup Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;