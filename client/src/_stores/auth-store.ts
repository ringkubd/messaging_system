import { create } from 'zustand';
import { User } from '@/_types';
import apiClient from '@/_lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('messaging_token') : null,
  isLoading: true,
  setUser: (user) => set({ user }),
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('messaging_token', token);
    set({ user, token });
  },
  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('messaging_token', token);
    set({ user, token });
  },
  logout: async () => {
    try { await apiClient.post('/auth/logout'); } catch {}
    localStorage.removeItem('messaging_token');
    set({ user: null, token: null });
  },
  checkAuth: async () => {
    try {
      const res = await apiClient.get('/me');
      set({ user: res.data, isLoading: false });
    } catch {
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
