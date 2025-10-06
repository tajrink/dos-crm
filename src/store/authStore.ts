import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      if (data.user && data.session) {
        set({ 
          user: data.user, 
          session: data.session,
          loading: false 
        });
        toast.success('Successfully signed in!');
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }

      set({ 
        user: null, 
        session: null, 
        loading: false 
      });
      toast.success('Successfully signed out!');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  initialize: async () => {
    console.log('Initializing auth...');
    
    // Set initialized immediately to prevent infinite loading
    set({ initialized: true });
    
    try {
      // Listen for auth changes first
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        
        set({ 
          user: session?.user ?? null,
          session: session ?? null 
        });

        if (event === 'SIGNED_OUT') {
          // Clear any cached data when user signs out
          localStorage.removeItem('supabase.auth.token');
        }
      });
      
      // Try to get initial session (non-blocking)
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session loaded:', session?.user?.email || 'No user');
          set({ 
            user: session?.user ?? null,
            session: session ?? null
          });
        }
      }).catch(error => {
        console.error('Failed to get initial session:', error);
      });
      
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  },
}));