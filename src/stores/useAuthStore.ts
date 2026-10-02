'use client';

import { create } from 'zustand';
import { getSession, signIn, signOut } from 'next-auth/react';

import { PublicUser } from '@/types/shared';

interface AuthState {
  user: PublicUser | null;
  isLoading: boolean;
  error: string | null;
  hasCheckedSession: boolean;

  checkSession: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, displayName: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  hasCheckedSession: false,

  clearError: () => set({ error: null }),

  checkSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const session = await getSession();
      set({ user: session?.user as PublicUser || null, hasCheckedSession: true, isLoading: false });
    } catch (err: any) {
      set({ user: null, hasCheckedSession: true, isLoading: false });
    }
  },

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });
      if (res?.error) {
        set({ error: 'Credenciais inválidas.', isLoading: false });
        return false;
      }
      const session = await getSession();
      set({ user: session?.user as PublicUser || null, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Erro de conexão.', isLoading: false });
      return false;
    }
  },

  register: async (username: string, displayName: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        set({ error: data.error || 'Erro ao registrar.', isLoading: false });
        return false;
      }
      // After register, login
      const loginRes = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });
      if (loginRes?.error) {
        set({ error: 'Registrado, mas falha ao fazer login.', isLoading: false });
        return false;
      }
      const session = await getSession();
      set({ user: session?.user as PublicUser || null, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Erro.', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await signOut({ redirect: false });
      set({ user: null, isLoading: false, error: null });
    } catch (err) {
      set({ user: null, isLoading: false });
    }
  },
}));
