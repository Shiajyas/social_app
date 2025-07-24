
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IAdmin, IPermissions } from '@/types/adminTypes'; // Make sure path matches
import { IUser } from '@/types/userTypes';
import { authService } from '@/services/authService';

interface AuthState {
  user: IUser | null;
  admin: IAdmin | null;
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;

  setUser: (user: IUser | null) => void;
  setAdmin: (admin: IAdmin | null) => void;
  updateUserFields: (fields: Partial<IUser>) => void;
  logout: (role?: 'user' | 'admin') => void;
  getAdminPermissions: () => IPermissions;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      admin: null,
      isUserAuthenticated: false,
      isAdminAuthenticated: false,

      setUser: (user) => {
        set({ user, isUserAuthenticated: !!user });
      },

      setAdmin: (admin) => {
        set({ admin, isAdminAuthenticated: !!admin });
      },

      updateUserFields: (fields) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        }));
      },

      logout: async (role) => {
        if (role === 'admin') {
          set({ admin: null, isAdminAuthenticated: false });
        } else {
          set({ user: null, isUserAuthenticated: false });
        }

        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }

        // Clear persisted auth data
        setTimeout(() => {
          useAuthStore.persist.clearStorage();
        }, 0);
      },

      getAdminPermissions: () => {
        const admin = get().admin;
        return admin?.permissions ?? {
          dashboard: false,
          subscription: false,
          spam: false,
          users: false,
          roleManagement: false,
        };
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  )
);
