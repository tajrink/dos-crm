import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Package,
  FileText,
  BarChart3,
  MessageSquare,
  PiggyBank,
  Settings,
  UserCheck,
  CreditCard,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  X,
  Wallet,
  History,
  Clock,
  User,
  PieChart,
  Settings2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Features', href: '/features', icon: Package },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { 
    name: 'Human Resources', 
    icon: UserCheck,
    isExpandable: true,
    children: [
      { name: 'HR Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
      { name: 'Employees', href: '/hr/employees', icon: Users },
      { name: 'Payroll', href: '/hr/payroll', icon: CreditCard },
      { name: 'Reports', href: '/hr/reports', icon: BarChart3 },
      { name: 'Leave Management', href: '/hr/leave', icon: Calendar },
      { name: 'Performance', href: '/hr/performance', icon: TrendingUp },
      { 
        name: 'Payment System',
        isExpandable: true,
        children: [
          { name: 'Payment History', href: '/hr/payments/history', icon: History },
          { name: 'Upcoming Payments', href: '/hr/payments/upcoming', icon: Clock },
          { name: 'Payment Analytics', href: '/hr/payments/analytics', icon: PieChart },
          { name: 'Payment Management', href: '/hr/payments/management', icon: Settings2 },
        ]
      },
    ]
  },
  { name: 'Requests', href: '/requests', icon: MessageSquare },
  { name: 'Budgets', href: '/budgets', icon: PiggyBank },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

const Sidebar = ({ isMobileMenuOpen, onCloseMobileMenu }: SidebarProps) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Human Resources']);

  console.log('🔍 Sidebar render - isMobileMenuOpen:', isMobileMenuOpen);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isHRRoute = location.pathname.startsWith('/hr');

  // Close mobile menu when route changes
  useEffect(() => {
    onCloseMobileMenu();
  }, [location.pathname, onCloseMobileMenu]);

  // Handle click on navigation link
  const handleNavClick = () => {
    onCloseMobileMenu();
  };

  const renderNavigation = () => {
    return navigation.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.href || (item.href === '/dashboard' && location.pathname === '/');
      const isExpanded = expandedItems.includes(item.name);
      
      if (item.isExpandable) {
        return (
          <div key={item.name}>
            <button
              onClick={() => toggleExpanded(item.name)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors duration-200',
                isHRRoute
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-white'
              )}
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isExpanded && (
              <div className="ml-4 mt-2 space-y-1">
                {item.children?.map((child) => {
                  if (child.isExpandable) {
                    const isChildExpanded = expandedItems.includes(child.name);
                    const isPaymentRoute = location.pathname.startsWith('/hr/payments');
                    
                    return (
                      <div key={child.name}>
                        <button
                          onClick={() => toggleExpanded(child.name)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors duration-200 text-sm',
                            isPaymentRoute
                              ? 'bg-green-600 dark:bg-green-500 text-white'
                              : 'text-gray-400 dark:text-gray-500 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-white'
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4" />
                            <span>{child.name}</span>
                          </div>
                          {isChildExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                        
                        {isChildExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {child.children?.map((grandChild) => {
                              const GrandChildIcon = grandChild.icon;
                              const isGrandChildActive = location.pathname === grandChild.href;
                              
                              return (
                                <Link
                                  key={grandChild.name}
                                  to={grandChild.href}
                                  onClick={handleNavClick}
                                  className={cn(
                                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-xs',
                                    isGrandChildActive
                                      ? 'bg-green-400 dark:bg-green-300 text-white'
                                      : 'text-gray-500 dark:text-gray-600 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-white'
                                  )}
                                >
                                  <GrandChildIcon className="h-3 w-3" />
                                  <span>{grandChild.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  const ChildIcon = child.icon;
                  const isChildActive = location.pathname === child.href;
                  
                  return (
                    <Link
                      key={child.name}
                      to={child.href}
                      onClick={handleNavClick}
                      className={cn(
                        'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm',
                        isChildActive
                          ? 'bg-blue-500 dark:bg-blue-400 text-white'
                          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-white'
                      )}
                    >
                      <ChildIcon className="h-4 w-4" />
                      <span>{child.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
      
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={handleNavClick}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200',
            isActive
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-white'
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{item.name}</span>
        </Link>
      );
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex bg-gray-900 dark:bg-gray-800 text-white w-64 space-y-6 py-7 px-2 flex-col">
        <div className="text-white flex items-center space-x-2 px-4">
          <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">DOS CRM</span>
        </div>
        
        <nav className="space-y-2">
          {renderNavigation()}
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      
      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 w-64 h-full bg-gray-900 text-white z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">DOS CRM</span>
            </div>
            <button
              onClick={onCloseMobileMenu}
              className="p-2 rounded-md text-gray-300 hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderNavigation()}
          </nav>
        </div>
      )}
    </>
  );
};

export default Sidebar;