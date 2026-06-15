import { create } from 'zustand';
import type { User, UserRole } from '../../shared/types';

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const saved = typeof window !== 'undefined' ? localStorage.getItem('visitor_user') : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: saved ? (JSON.parse(saved) as User) : null,
  login: (user) => {
    localStorage.setItem('visitor_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('visitor_user');
    set({ user: null });
  },
}));

export const roleLabels: Record<UserRole, string> = {
  visitor: '访客',
  employee: '员工',
  security: '保安',
  admin: '管理员',
};
