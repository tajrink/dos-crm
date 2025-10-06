import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Search,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import BudgetModal from '../../components/modals/BudgetModal';
import ExpenseModal from '../../components/modals/ExpenseModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

interface BudgetCategory {
  id: string;
  name: string;
  annual_budget?: number;
  monthly_budget?: number;
  is_active: boolean;
  created_at: string;
}

interface BudgetExpense {
  id: string;
  category_id: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url?: string;
  created_at: string;
}

interface BudgetStats {
  totalBudget: number;
  totalSpent: number;
  variance: number;
  variancePercentage: number;
  categoriesOverBudget: number;
}

const Budgets = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<BudgetExpense | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch budget categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as BudgetCategory[];
    }
  });

  // Fetch budget expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['budget-expenses', selectedPeriod, selectedMonth],
    queryFn: async () => {
      const startDate = selectedPeriod === 'monthly' 
        ? startOfMonth(selectedMonth)
        : startOfYear(selectedMonth);
      const endDate = selectedPeriod === 'monthly'
        ? endOfMonth(selectedMonth)
        : endOfYear(selectedMonth);

      const { data, error } = await supabase
        .from('budget_expenses')
        .select('*')
        .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
        .lte('expense_date', format(endDate, 'yyyy-MM-dd'))
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data as BudgetExpense[];
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('budget_categories')
        .update({ is_active: false })
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success('Budget category deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete budget category');
      console.error('Delete category error:', error);
    }
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('budget_expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete expense');
      console.error('Delete expense error:', error);
    }
  });

  // Calculate budget statistics
  const budgetStats = useMemo((): BudgetStats => {
    const totalBudget = categories.reduce((sum, category) => {
      const budget = selectedPeriod === 'monthly' 
        ? (category.monthly_budget || 0) 
        : (category.annual_budget || 0);
      return sum + budget;
    }, 0);

    const totalSpent = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const variance = totalBudget - totalSpent;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    const categoriesOverBudget = categories.filter(category => {
      const categoryExpenses = expenses
        .filter(expense => expense.category_id === category.id)
        .reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const budget = selectedPeriod === 'monthly' 
        ? (category.monthly_budget || 0) 
        : (category.annual_budget || 0);
      return categoryExpenses > budget;
    }).length;

    return {
      totalBudget,
      totalSpent,
      variance,
      variancePercentage,
      categoriesOverBudget
    };
  }, [categories, expenses, selectedPeriod]);

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get category expenses and calculate variance
  const getCategoryData = (category: BudgetCategory) => {
    const categoryExpenses = expenses.filter(expense => expense.category_id === category.id);
    const totalSpent = categoryExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const budget = selectedPeriod === 'monthly' 
      ? (category.monthly_budget || 0) 
      : (category.annual_budget || 0);
    const variance = budget - totalSpent;
    const variancePercentage = budget > 0 ? (variance / budget) * 100 : 0;
    const isOverBudget = totalSpent > budget;

    return {
      expenses: categoryExpenses,
      totalSpent,
      budget,
      variance,
      variancePercentage,
      isOverBudget
    };
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setShowBudgetModal(true);
  };

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'expense';
    id: string | null;
    name: string | null;
  }>({
    isOpen: false,
    type: 'category',
    id: null,
    name: null,
  });

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setConfirmationModal({
      isOpen: true,
      type: 'category',
      id: categoryId,
      name: category?.name || 'this category',
    });
  };

  const handleAddExpense = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setSelectedExpense(null);
    setShowExpenseModal(true);
  };

  const handleEditExpense = (expense: BudgetExpense) => {
    const category = categories.find(c => c.id === expense.category_id);
    setSelectedCategory(category || null);
    setSelectedExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = categories
      .flatMap(c => c.expenses || [])
      .find(e => e.id === expenseId);
    setConfirmationModal({
      isOpen: true,
      type: 'expense',
      id: expenseId,
      name: expense?.description || 'this expense',
    });
  };

  const handleConfirmDelete = () => {
    if (confirmationModal.id) {
      if (confirmationModal.type === 'category') {
        deleteCategoryMutation.mutate(confirmationModal.id);
      } else {
        deleteExpenseMutation.mutate(confirmationModal.id);
      }
      setConfirmationModal({ isOpen: false, type: 'category', id: null, name: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, type: 'category', id: null, name: null });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(safeAmount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600 dark:text-green-400';
    if (variance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  if (categoriesLoading || expensesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Budget Management
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowBudgetModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Period and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-4 py-2 rounded-lg ${
              selectedPeriod === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPeriod('annual')}
            className={`px-4 py-2 rounded-lg ${
              selectedPeriod === 'annual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Annual
          </button>
        </div>

        {selectedPeriod === 'monthly' && (
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        )}

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Budget Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(budgetStats.totalBudget)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(budgetStats.totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Variance</p>
              <p className={`text-2xl font-bold ${getVarianceColor(budgetStats.variance)}`}>
                {formatCurrency(Math.abs(budgetStats.variance))}
              </p>
              <p className={`text-sm ${getVarianceColor(budgetStats.variance)} flex items-center gap-1`}>
                {getVarianceIcon(budgetStats.variance)}
                {Math.abs(budgetStats.variancePercentage).toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              budgetStats.variance > 0 
                ? 'bg-green-100 dark:bg-green-900' 
                : 'bg-red-100 dark:bg-red-900'
            }`}>
              {getVarianceIcon(budgetStats.variance)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Over Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {budgetStats.categoriesOverBudget}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {budgetStats.categoriesOverBudget === 1 ? 'Category' : 'Categories'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Categories ({filteredCategories.length})
          </h2>
        </div>
        
        {filteredCategories.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No categories match your search.' : 'No budget categories found. Create your first category to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCategories.map((category) => {
              const categoryData = getCategoryData(category);
              return (
                <div key={category.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddExpense(category)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Add Expense"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Edit Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(categoryData.budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Spent</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(categoryData.totalSpent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                          <p className={`font-semibold ${getVarianceColor(categoryData.variance)}`}>
                            {formatCurrency(Math.abs(categoryData.variance))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  categoryData.isOverBudget
                                    ? 'bg-red-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    (categoryData.totalSpent / categoryData.budget) * 100,
                                    100
                                  )}%`
                                }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${
                              categoryData.isOverBudget
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {Math.abs(categoryData.variancePercentage).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Expenses */}
                      {categoryData.expenses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Recent Expenses ({categoryData.expenses.length})
                          </h4>
                          <div className="space-y-2">
                            {categoryData.expenses.slice(0, 3).map((expense) => (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {expense.description}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(expense.amount)}
                                  </span>
                                  <button
                                    onClick={() => handleEditExpense(expense)}
                                    className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    title="Edit Expense"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    title="Delete Expense"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {categoryData.expenses.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                +{categoryData.expenses.length - 3} more expenses
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showBudgetModal && (
        <BudgetModal
          category={selectedCategory}
          onClose={() => {
            setShowBudgetModal(false);
            setSelectedCategory(null);
          }}
        />
      )}

      {showExpenseModal && selectedCategory && (
        <ExpenseModal
          category={selectedCategory}
          expense={selectedExpense}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedCategory(null);
            setSelectedExpense(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={`Delete ${confirmationModal.type === 'category' ? 'Budget Category' : 'Expense'}`}
        message={`Are you sure you want to delete "${confirmationModal.name}"? This action cannot be undone${confirmationModal.type === 'category' ? ' and will also delete all associated expenses' : ''}.`}
        confirmText={`Delete ${confirmationModal.type === 'category' ? 'Category' : 'Expense'}`}
        cancelText="Cancel"
        type="danger"
        isLoading={confirmationModal.type === 'category' ? deleteCategoryMutation.isPending : deleteExpenseMutation.isPending}
      />
    </div>
  );
};

export default Budgets;