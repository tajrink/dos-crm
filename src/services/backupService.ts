import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';

interface BackupData {
  timestamp: string;
  clients: any[];
  projects: any[];
  invoices: any[];
  employees: any[];
  payrollRecords: any[];
  features: any[];
  requests: any[];
  budgets: any[];
  salaries: any[];
  companyProfiles: any[];
  userProfiles: any[];
  systemSettings: any[];
}

class BackupService {
  private isInitialized = false;
  private backupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEmailService();
  }

  private async initializeEmailService() {
    try {
      // Initialize EmailJS
      // Note: In production, you would need to set up EmailJS service with proper credentials
      // For now, we'll mark as initialized but email functionality will fall back to download
      this.isInitialized = false; // Set to false to use fallback for now
      console.log('Email service initialization attempted - using fallback for now');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isInitialized = false;
    }
  }

  async exportAllData(): Promise<BackupData> {
    try {
      const timestamp = new Date().toISOString();

      // Fetch all data from Supabase
      const [
        clientsResult,
        projectsResult,
        invoicesResult,
        employeesResult,
        payrollResult,
        featuresResult,
        requestsResult,
        budgetsResult,
        salariesResult,
        companyProfilesResult,
        userProfilesResult,
        systemSettingsResult
      ] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('payroll_records').select('*'),
        supabase.from('features').select('*'),
        supabase.from('team_requests').select('*'),
        supabase.from('budgets').select('*'),
        supabase.from('salaries').select('*'),
        supabase.from('company_profiles').select('*'),
        supabase.from('user_profiles').select('*'),
        supabase.from('system_settings').select('*')
      ]);

      // Check for errors
      const results = [
        clientsResult, projectsResult, invoicesResult, employeesResult,
        payrollResult, featuresResult, requestsResult, budgetsResult,
        salariesResult, companyProfilesResult, userProfilesResult, systemSettingsResult
      ];

      for (const result of results) {
        if (result.error) {
          throw new Error(`Database query failed: ${result.error.message}`);
        }
      }

      const backupData: BackupData = {
        timestamp,
        clients: clientsResult.data || [],
        projects: projectsResult.data || [],
        invoices: invoicesResult.data || [],
        employees: employeesResult.data || [],
        payrollRecords: payrollResult.data || [],
        features: featuresResult.data || [],
        requests: requestsResult.data || [],
        budgets: budgetsResult.data || [],
        salaries: salariesResult.data || [],
        companyProfiles: companyProfilesResult.data || [],
        userProfiles: userProfilesResult.data || [],
        systemSettings: systemSettingsResult.data || []
      };

      return backupData;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async sendBackupEmail(backupData: BackupData): Promise<void> {
    // For now, we'll use the fallback method since email service setup requires external configuration
    console.log('Email service not fully configured, using file download method');
    await this.fallbackToFileDownload(backupData);
    
    // Log what would be sent via email
    console.log(`
EMAIL THAT WOULD BE SENT TO: inkcansaylot@gmail.com

Subject: CRM Weekly Backup - ${new Date().toLocaleDateString()}

Body:
Weekly automated backup of CRM system data.

Backup Details:
- Timestamp: ${backupData.timestamp}
- Clients: ${backupData.clients.length} records
- Projects: ${backupData.projects.length} records
- Invoices: ${backupData.invoices.length} records
- Employees: ${backupData.employees.length} records
- Payroll Records: ${backupData.payrollRecords.length} records
- Features: ${backupData.features.length} records
- Requests: ${backupData.requests.length} records
- Budgets: ${backupData.budgets.length} records
- Salaries: ${backupData.salaries.length} records

This backup contains all platform data and can be used for restoration if needed.

Note: This is an automated backup with no retention policy - old backups are automatically cleared.

Best regards,
Devs On Steroids CRM System

Attachment: crm-backup-${new Date().toISOString().split('T')[0]}.json
    `);
  }

  private async fallbackToFileDownload(backupData: BackupData): Promise<void> {
    try {
      const backupJson = JSON.stringify(backupData, null, 2);
      const filename = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;

      // Create a downloadable backup file as fallback
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`Backup created and downloaded as fallback: ${filename}`);
    } catch (error) {
      console.error('Failed to create backup file:', error);
    }
  }

  async performWeeklyBackup(): Promise<void> {
    try {
      console.log('Starting weekly backup...');
      
      // Export all data
      const backupData = await this.exportAllData();
      
      // Send backup email (currently downloads file)
      await this.sendBackupEmail(backupData);
      
      // Clear old backups (no retention policy)
      await this.clearOldBackups();
      
      console.log('Weekly backup completed successfully');
    } catch (error) {
      console.error('Weekly backup failed:', error);
      
      // Send error notification
      await this.sendErrorNotification(error);
    }
  }

  private async clearOldBackups(): Promise<void> {
    try {
      // Clear any temporary backup data from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('backup_') || key.startsWith('crm-backup-')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Old backup data cleared from localStorage (no retention policy)');
    } catch (error) {
      console.error('Failed to clear old backups:', error);
    }
  }

  private async sendErrorNotification(error: any): Promise<void> {
    try {
      console.error(`
ERROR EMAIL THAT WOULD BE SENT TO: inkcansaylot@gmail.com

Subject: CRM Backup Failed - Action Required

Body:
CRM Backup Failed - Action Required

Error Details:
${error.message || error}

Timestamp: ${new Date().toISOString()}

Please check the system logs and resolve the issue to ensure data backup continuity.

Best regards,
Devs On Steroids CRM System
      `);
    } catch (emailError) {
      console.error('Failed to send error notification:', emailError);
    }
  }

  startWeeklyBackupSchedule(): void {
    try {
      // Clear any existing interval
      if (this.backupInterval) {
        clearInterval(this.backupInterval);
      }

      // Schedule backup every week (7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
      const weeklyInterval = 7 * 24 * 60 * 60 * 1000;
      
      this.backupInterval = setInterval(async () => {
        await this.performWeeklyBackup();
      }, weeklyInterval);

      console.log('Weekly backup schedule started - runs every 7 days');
      
      // Optionally trigger an initial backup after a short delay
      setTimeout(async () => {
        console.log('Running initial backup check...');
        // You can uncomment the line below to run an immediate backup for testing
        // await this.performWeeklyBackup();
      }, 5000);
      
    } catch (error) {
      console.error('Failed to start backup schedule:', error);
    }
  }

  stopWeeklyBackupSchedule(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('Weekly backup schedule stopped');
    }
  }

  async triggerManualBackup(): Promise<void> {
    console.log('Manual backup triggered');
    await this.performWeeklyBackup();
  }
}

export const backupService = new BackupService();