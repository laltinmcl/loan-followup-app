import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password });
        set({ token: data.token, user: data.user });
      },
      logout: () => set({ token: null, user: null }),
      checkAuth: async () => {
        if (!get().token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch {
          set({ token: null, user: null });
        }
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ token: state.token, user: state.user }) }
  )
);
