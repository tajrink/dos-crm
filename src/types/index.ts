// Client Management Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: 'active' | 'inactive' | 'prospect';
  reference_source?: string;
  reference_details?: string;
  created_at: string;
  updated_at: string;
}

// Project Management Types
export interface Project {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: 'Backlog' | 'Ready to Quote' | 'Quoted' | 'Scheduled' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  end_date?: string;
  budget: number;
  work_scope?: string;
  deliverables?: any[];
  scope_approved?: boolean;
  scope_approved_date?: string;
  created_at: string;
  updated_at: string;
}

// Feature Catalog Types
export interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  complexity: 'low' | 'medium' | 'high';
  estimated_hours: number;
  created_at: string;
  updated_at: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  client_id: string;
  project_id?: string;
  invoice_number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

// Invoice Template Types
export interface InvoiceTemplate {
  id: string;
  name: string;
  is_default: boolean;
  company_logo_url?: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  tax_number?: string;
  theme_color: string;
  layout_style: string;
  header_style?: any;
  footer_text?: string;
  terms_conditions?: string;
  payment_instructions?: string;
  created_at: string;
  updated_at: string;
}

// Payment Types
export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'other';
  notes?: string;
  created_at: string;
}

// Salary Types (Legacy - kept for backward compatibility)
export interface Salary {
  id: string;
  employee_name: string;
  position: string;
  base_salary: number;
  bonuses?: number;
  deductions?: number;
  net_salary: number;
  pay_period: string;
  created_at: string;
}

// Request Types
export interface Request {
  id: string;
  client_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Budget Types
export interface Budget {
  id: string;
  project_id?: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  period: string;
  created_at: string;
  updated_at: string;
}

// HRM System Types

// Employee Management Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  department: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  joining_date: string;
  leaving_date?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  base_salary: number;
  currency: 'USD' | 'BDT';
  skills?: string[];
  qualifications?: string[];
  emergency_contact?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Payroll Management Types
export interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  bonuses?: number;
  deductions?: any; // JSONB field
  tax_amount?: number;
  net_salary: number;
  currency?: string;
  exchange_rate?: number;
  payment_date?: string;
  payment_method?: string;
  payment_by?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employees?: Employee;
}

// Leave Management Types
export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  supporting_documents?: string[];
  is_half_day?: boolean;
  half_day_period?: 'morning' | 'afternoon';
  created_at: string;
  updated_at: string;
}

// Performance Management Types
export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period_start: string;
  review_period_end: string;
  overall_rating: number; // 1-5 scale
  technical_skills_rating: number;
  communication_rating: number;
  teamwork_rating: number;
  leadership_rating: number;
  punctuality_rating: number;
  goals_achieved: string[];
  areas_of_improvement: string[];
  achievements: string[];
  feedback: string;
  employee_comments?: string;
  development_plan?: string;
  salary_adjustment_recommended?: boolean;
  recommended_salary_increase_percentage?: number;
  promotion_recommended?: boolean;
  recommended_position?: string;
  next_review_date?: string;
  status: 'draft' | 'submitted' | 'approved' | 'finalized';
  created_at: string;
  updated_at: string;
}

// Employee Document Management Types
export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_name: string;
  document_type: 'resume' | 'contract' | 'id_copy' | 'certificate' | 'performance_review' | 'other';
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  is_confidential: boolean;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Salary History Types
export interface SalaryHistory {
  id: string;
  employee_id: string;
  previous_salary_usd: number;
  previous_salary_bdt: number;
  new_salary_usd: number;
  new_salary_bdt: number;
  change_percentage: number;
  change_reason: 'promotion' | 'performance_review' | 'market_adjustment' | 'cost_of_living' | 'other';
  effective_date: string;
  approved_by: string;
  notes?: string;
  created_at: string;
}

// Leave Balance Types
export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency';
  total_allocated: number;
  used_days: number;
  remaining_days: number;
  year: number;
  created_at: string;
  updated_at: string;
}

// Department Types
export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  budget_usd?: number;
  budget_bdt?: number;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

// HRM Dashboard Analytics Types
export interface HRAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  monthlyPayrollUSD: number;
  monthlyPayrollBDT: number;
  averageSalaryUSD: number;
  averageSalaryBDT: number;
  highestSalaryUSD: number;
  highestSalaryBDT: number;
  departmentBreakdown: {
    department: string;
    count: number;
    totalSalaryUSD: number;
    totalSalaryBDT: number;
  }[];
  salaryDistribution: {
    range: string;
    count: number;
  }[];
  recentActivities: {
    id: string;
    type: 'hire' | 'termination' | 'promotion' | 'salary_change' | 'leave_request';
    employee_name: string;
    description: string;
    date: string;
  }[];
}

// Team Request Types (existing)
export interface TeamRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'Backlog' | 'In Progress' | 'Review' | 'Completed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}