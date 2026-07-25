import { create } from 'zustand';
import { getCookie, deleteCookie } from '@/lib/cookies';

type UserRole = 'admin' | 'mentor' | 'participant' | null;

interface AuthState {
  role: UserRole;
  userId: string | null;
  initAuth: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  userId: null,

  initAuth: () => {
    const raw = getCookie('mp_role');
    if (raw === 'admin' || raw === 'mentor' || raw === 'participant') {
      set({ role: raw, userId: getCookie('mp_user_id') ?? null });
    } else {
      set({ role: null, userId: null });
    }
  },

  clearAuth: () => {
    deleteCookie('mp_access_token');
    deleteCookie('mp_refresh_token');
    deleteCookie('mp_role');
    deleteCookie('mp_user_id');
    set({ role: null, userId: null });
  },
}));
