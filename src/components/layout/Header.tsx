import { User, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import ThemeToggle from '../ThemeToggle';
import NotificationDropdown from '../NotificationDropdown';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

const Header = ({ onToggleMobileMenu }: HeaderProps) => {
  const { user, signOut, loading } = useAuthStore();

  // Fetch user profile data
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
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

  // Get display name with fallback logic
  const getDisplayName = () => {
    if (userProfile?.fullName || userProfile?.full_name) {
      return userProfile.fullName || userProfile.full_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Devs On Steroids CRM</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          
          <ThemeToggle />
          
          <div className="flex items-center space-x-2">
            <div className="bg-gray-300 dark:bg-gray-600 p-2 rounded-full">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getDisplayName()}
            </span>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;